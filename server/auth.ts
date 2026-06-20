import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { supabase } from "./supabase";
import { User as SelectUser } from "@shared/schema";
import { sendVerificationEmail, verifyCode } from "./email";

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

export async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const supplyBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, supplyBuf);
}

async function resolveAdminUser(req: Request): Promise<SelectUser | null> {
    if (req.user) {
        const u = req.user as SelectUser;
        if (u.isAdmin || (u as any).is_admin || u.role === 'admin') return u;
    }

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const { data: { user: supaUser }, error } = await supabase.auth.getUser(token);
        if (error || !supaUser) return null;
        const dbUser = await storage.getUser(supaUser.id);
        if (dbUser && (dbUser.isAdmin || (dbUser as any).is_admin || dbUser.role === 'admin')) {
            return dbUser;
        }
    }
    return null;
}

export function setupAuth(app: Express) {
    const sessionSettings: session.SessionOptions = {
        secret: process.env.SESSION_SECRET || "kashta_secret_key",
        resave: false,
        saveUninitialized: false,
        store: new MemoryStore({
            checkPeriod: 86400000,
        }),
        cookie: {
            secure: app.get("env") === "production",
        },
    };

    if (app.get("env") === "production") {
        app.set("trust proxy", 1);
    }

    app.use(session(sessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
                const user = await storage.getUserByUsername(username);
                if (!user || !(await comparePasswords(password, user.password))) {
                    return done(null, false);
                }
                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }),
    );

    passport.serializeUser((user, done) => done(null, (user as SelectUser).id));
    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await storage.getUser(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    });

    // Email verification endpoints
    app.post("/api/auth/send-code", async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: "البريد الإلكتروني مطلوب" });
            }
            
            // Check if user already exists using Supabase
            const { data: existingUsers } = await supabase.from('users').select('id').eq('email', email).limit(1);
            if (existingUsers && existingUsers.length > 0) {
                 return res.status(400).json({ message: "هذا البريد الإلكتروني مسجل مسبقاً" });
            }
            
            await sendVerificationEmail(email);
            res.json({ message: "تم إرسال كود التحقق بنجاح" });
        } catch (error) {
            console.error("Error sending verification email:", error);
            res.status(500).json({ message: "حدث خطأ أثناء إرسال كود التحقق" });
        }
    });

    app.post("/api/auth/verify", (req, res) => {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ message: "البريد الإلكتروني والكود مطلوبان" });
        }
        
        const isValid = verifyCode(email, code);
        if (isValid) {
            res.json({ success: true, message: "تم التحقق من البريد الإلكتروني بنجاح" });
        } else {
            res.status(400).json({ success: false, message: "الكود غير صحيح أو منتهي الصلاحية" });
        }
    });

    app.post("/api/register", async (req, res, next) => {
        try {
            const existingUser = await storage.getUserByUsername(req.body.username);
            if (existingUser) {
                return res.status(400).send("Username already exists");
            }

            const hashedPassword = await hashPassword(req.body.password);
            const user = await storage.createUser({
                ...req.body,
                password: hashedPassword,
            });

            req.login(user, (err) => {
                if (err) return next(err);
                res.status(201).json(user);
            });
        } catch (error) {
            next(error);
        }
    });

    app.post("/api/login", passport.authenticate("local"), (req, res) => {
        res.status(200).json(req.user);
    });

    app.post("/api/logout", (req, res, next) => {
        req.logout((err) => {
            if (err) return next(err);
            res.sendStatus(200);
        });
    });

    app.get("/api/user", (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(req.user);
    });

    // Admin-only: Create staff account with hashed password
    app.post("/api/admin/create-staff", async (req, res, next) => {
        console.log("🔹 [CREATE-STAFF] Request received", { username: req.body.username, role: req.body.role });

        const requestUser = await resolveAdminUser(req);

        if (!requestUser) {
            console.warn("⚠️ [ADMIN_ONLY] Unauthorized access attempt to create-staff");
            return res.status(403).json({ message: "عذراً، هذا الإجراء مخصص للمديرين فقط" });
        }

        try {
            const { username, password, email, phone, name, role, permissions } = req.body;

            const existingUser = await storage.getUserByUsername(username);
            if (existingUser) {
                console.error("❌ [CREATE-STAFF] Username already exists:", username);
                return res.status(400).json({ message: "اسم المستخدم موجود بالفعل" });
            }

            const hashedPassword = await hashPassword(password);

            // 1. Create User
            console.log("👤 [CREATE-STAFF] Creating user account...");
            const user = await storage.createUser({
                username,
                password: hashedPassword,
                confirmPassword: hashedPassword,
                email,
                phone,
                role,
                permissions,
                isAdmin: true
            });
            console.log("✅ [CREATE-STAFF] User created successfully:", user.id);

            // 2. Create Staff record
            console.log("📋 [CREATE-STAFF] Creating staff record...");
            const { data: staffData, error: staffError } = await supabase.from('staff').insert([{
                user_id: user.id,
                name,
                phone,
                role,
                permissions,
                is_active: true
            }]).select();

            if (staffError) {
                console.error("❌ [CREATE-STAFF] Error creating staff record:");
                console.error("Error code:", staffError.code);
                console.error("Error message:", staffError.message);
                console.error("Error details:", staffError.details);
                console.error("Error hint:", staffError.hint);
                throw new Error(`فشل إنشاء سجل الموظف: ${staffError.message}`);
            }

            console.log("✅ [CREATE-STAFF] Staff record created successfully:", staffData);

            res.status(201).json(user);

        } catch (error: any) {
            console.error("💥 [CREATE-STAFF] Fatal error:", error.message);
            console.error("Stack:", error.stack);
            res.status(500).json({ message: error.message || "خطأ في إنشاء حساب الموظف" });
        }
    });

    app.get("/api/admin/users/recent", async (req, res) => {
        const user = await resolveAdminUser(req);

        if (!user) {
            return res.status(403).json({ message: "غير مصرح لك بالوصول لبيانات المستخدمين" });
        }

        try {
            const allUsers = await storage.getUsers();
            res.json(allUsers || []);
        } catch (error: any) {
            console.error("❌ users/recent error:", error.message);
            res.status(500).json({ message: error.message });
        }
    });

    app.post("/api/admin/users/ban", async (req, res) => {
        const user = await resolveAdminUser(req);

        if (!user) {
            return res.status(403).json({ message: "غير مصرح لك" });
        }

        try {
            const { id, isBanned } = req.body;
            if (!id) return res.status(400).json({ message: "id مطلوب" });

            const { error } = await supabase
                .from('users')
                .update({ is_banned: isBanned })
                .eq('id', id);

            if (error) throw error;
            res.json({ success: true });
        } catch (error: any) {
            console.error("❌ ban user error:", error.message);
            res.status(500).json({ message: error.message });
        }
    });

    // 2. Promote an existing user to staff
    app.post("/api/admin/promote-staff", async (req, res) => {
        const user = await resolveAdminUser(req);

        if (!user) {
            console.warn("🚫 [ADMIN_ACCESS_DENIED] to promote-staff");
            return res.status(403).json({ message: "غير مصرح لك بترقية المستخدمين" });
        }

        try {
            const { userId, name, phone, role, permissions } = req.body;

            if (!userId || !name || !role) {
                return res.status(400).json({ message: "UserId, Name and Role are required" });
            }

            // Update user table - set role
            const { error: userUpdateError } = await supabase
                .from('users')
                .update({ role: role, is_admin: role === 'manager' })
                .eq('id', userId);

            if (userUpdateError) throw userUpdateError;

            // Create staff record
            const { data: staffData, error: staffError } = await supabase
                .from('staff')
                .insert([{
                    user_id: userId,
                    name,
                    phone: phone || "",
                    role,
                    permissions: permissions || [],
                    is_active: true
                }])
                .select()
                .single();

            if (staffError) throw staffError;

            res.status(201).json(staffData);
        } catch (error: any) {
            console.error("❌ [PROMOTE-STAFF] Error:", error.message);
            res.status(500).json({ message: error.message });
        }
    });

    // 3. Fire a staff member — delete staff record + demote user back to customer
    app.post("/api/admin/fire-staff", async (req, res) => {
        const requestUser = await resolveAdminUser(req);

        if (!requestUser) {
            return res.status(403).json({ message: "غير مصرح لك بهذا الإجراء" });
        }

        try {
            const { staffId } = req.body;

            if (!staffId) {
                return res.status(400).json({ message: "staffId مطلوب" });
            }

            // 1. Get staff record to find the linked user_id
            const { data: staffData, error: fetchError } = await supabase
                .from('staff')
                .select('user_id')
                .eq('id', staffId)
                .single();

            if (fetchError || !staffData) {
                return res.status(404).json({ message: "لم يتم العثور على سجل الموظف" });
            }

            const userId = staffData.user_id;

            // 2. Delete the staff record
            const { error: deleteError } = await supabase
                .from('staff')
                .delete()
                .eq('id', staffId);

            if (deleteError) throw deleteError;

            // 3. Demote the user back to regular customer (if a linked user exists)
            if (userId) {
                const { error: demoteError } = await supabase
                    .from('users')
                    .update({ role: 'customer', is_admin: false })
                    .eq('id', userId);

                if (demoteError) throw demoteError;
            }

            console.log(`✅ [FIRE-STAFF] Staff #${staffId} (user: ${userId}) fired and demoted to customer`);
            res.json({ success: true });

        } catch (error: any) {
            console.error("❌ [FIRE-STAFF] Error:", error.message);
            res.status(500).json({ message: error.message });
        }
    });
}

