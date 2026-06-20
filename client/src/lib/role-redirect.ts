export function getRoleRedirect(role: string | undefined, isAdmin: boolean): string {
  if (isAdmin || role === "admin") return "/admin/dashboard";
  switch (role) {
    case "delivery":   return "/delivery";
    case "butcher":    return "/cashier";
    case "manager":    return "/manager";
    case "accountant": return "/accountant";
    case "support":    return "/support";
    case "designer":   return "/designer";
    default:           return "/";
  }
}
