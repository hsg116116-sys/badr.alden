
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Trash2, Crosshair, Circle as CircleIcon, Square, Hexagon,
    ZoomIn, ZoomOut, Search, MapPin, Loader2, X, Globe,
    Layers, Navigation, Maximize2, Minimize2, ChevronDown, Map, Undo2, Sparkles
} from 'lucide-react';

declare global { interface Window { maptilersdk: any; } }

interface ZoneMapProps {
    initialCoordinates?: [number, number][];
    onChange: (coords: [number, number][] | null) => void;
    existingZones?: Array<{ id: number; name: string; coordinates: any; }>;
    editingZoneId?: number;
}

// [lng_west, lat_south, lng_east, lat_north] — bounding box per neighborhood
const AREA_BOUNDS: Record<string, [number, number, number, number]> = {
    "وسط البلد":      [31.220, 30.030, 31.260, 30.062],
    "الزمالك":        [31.210, 30.058, 31.232, 30.078],
    "المنيل":         [31.214, 29.990, 31.232, 30.025],
    "روضة":           [31.220, 30.000, 31.240, 30.020],
    "عابدين":         [31.230, 30.030, 31.258, 30.052],
    "السيدة زينب":    [31.234, 30.022, 31.258, 30.042],
    "باب الشعرية":    [31.242, 30.052, 31.270, 30.072],
    "الموسكي":        [31.240, 30.040, 31.270, 30.060],
    "مدينة نصر":      [31.300, 30.040, 31.370, 30.100],
    "المقطم":         [31.270, 29.990, 31.330, 30.030],
    "النزهة":         [31.300, 30.090, 31.355, 30.130],
    "عين شمس":        [31.290, 30.100, 31.340, 30.142],
    "المطرية":        [31.280, 30.120, 31.322, 30.162],
    "المرج":          [31.320, 30.130, 31.382, 30.180],
    "العباسية":       [31.258, 30.060, 31.292, 30.082],
    "الزيتون":        [31.280, 30.082, 31.320, 30.112],
    "شبرا":           [31.230, 30.080, 31.270, 30.122],
    "المعادي":        [31.240, 29.940, 31.280, 30.000],
    "حلوان":          [31.310, 29.820, 31.362, 29.882],
    "دار السلام":     [31.240, 29.970, 31.270, 30.002],
    "مصر القديمة":    [31.210, 29.990, 31.242, 30.022],
    "طره":            [31.270, 29.900, 31.312, 29.952],
    "المعصرة":        [31.290, 29.870, 31.332, 29.912],
    "بشتيل":          [31.120, 30.020, 31.152, 30.052],
    "مصر الجديدة":    [31.310, 30.082, 31.362, 30.122],
    "شبرا الخيمة":    [31.230, 30.112, 31.272, 30.172],
    "الوايلي":        [31.270, 30.070, 31.302, 30.092],
    "التجمع الخامس":  [31.460, 29.970, 31.522, 30.052],
    "القاهرة الجديدة":[31.420, 29.982, 31.502, 30.052],
    "الرحاب":         [31.472, 30.022, 31.522, 30.082],
    "مدينتي":         [31.530, 29.992, 31.602, 30.062],
    "الجيزة":         [31.182, 30.002, 31.232, 30.032],
    "الهرم":          [31.102, 29.942, 31.182, 29.992],
    "المهندسين":      [31.190, 30.052, 31.222, 30.072],
    "الدقي":          [31.200, 30.042, 31.232, 30.072],
    "العجوزة":        [31.192, 30.062, 31.222, 30.082],
    "إمبابة":         [31.202, 30.062, 31.242, 30.102],
    "فيصل":           [31.100, 29.962, 31.162, 30.012],
    "الحوامدية":      [31.222, 29.852, 31.272, 29.902],
    "6 أكتوبر":       [30.942, 29.912, 31.042, 29.972],
    "الشيخ زايد":     [30.922, 29.992, 30.982, 30.042],
    "حدائق أكتوبر":   [30.952, 29.932, 31.022, 29.992],
    "الواحة":         [30.992, 29.882, 31.062, 29.942],
    "أبو النمرس":     [31.072, 29.962, 31.112, 30.002],
};

// Convert bounding box to polygon ring [lng, lat][]
const bboxToPolygon = (b: [number, number, number, number]): [number, number][] => [
    [b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]], [b[0], b[1]]
];

const NEIGHBORHOODS = [
    { group: "القاهرة — وسط",       color: "indigo",  areas: ["وسط البلد","الزمالك","المنيل","روضة","عابدين","السيدة زينب","باب الشعرية","الموسكي"] },
    { group: "القاهرة — شرق",       color: "violet",  areas: ["مدينة نصر","المقطم","النزهة","عين شمس","المطرية","المرج","العباسية","الزيتون","شبرا"] },
    { group: "القاهرة — جنوب",      color: "emerald", areas: ["المعادي","حلوان","دار السلام","مصر القديمة","طره","المعصرة","بشتيل"] },
    { group: "القاهرة — شمال/شرق",  color: "sky",     areas: ["مصر الجديدة","شبرا الخيمة","الوايلي","التجمع الخامس","القاهرة الجديدة","الرحاب","مدينتي"] },
    { group: "الجيزة",              color: "rose",    areas: ["الجيزة","الهرم","المهندسين","الدقي","العجوزة","إمبابة","فيصل","الحوامدية"] },
    { group: "أكتوبر والشيخ زايد",  color: "orange",  areas: ["6 أكتوبر","الشيخ زايد","حدائق أكتوبر","الواحة","أبو النمرس"] },
];

const colorStyle: Record<string, { chip: string; header: string }> = {
    indigo:  { chip: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200",   header: "text-indigo-700 bg-indigo-50/60" },
    violet:  { chip: "bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200",   header: "text-violet-700 bg-violet-50/60" },
    emerald: { chip: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200", header: "text-emerald-700 bg-emerald-50/60" },
    sky:     { chip: "bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200",               header: "text-sky-700 bg-sky-50/60" },
    rose:    { chip: "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200",           header: "text-rose-700 bg-rose-50/60" },
    orange:  { chip: "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200",   header: "text-orange-700 bg-orange-50/60" },
};

const MAPTILER_KEY = "9oAkrxTWJrl3BLAkM7Vv";

export default function ZoneMap({ initialCoordinates, onChange, existingZones = [], editingZoneId }: ZoneMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const wrapperRef   = useRef<HTMLDivElement>(null);
    const map          = useRef<any>(null);

    const [isMapLoaded,      setIsMapLoaded]      = useState(false);
    const [isFullscreen,     setIsFullscreen]     = useState(false);
    const [showNeighborhoods,setShowNeighborhoods] = useState(false);
    const [expandedGroup,    setExpandedGroup]    = useState<string | null>("القاهرة — وسط");
    const [drawnArea,        setDrawnArea]        = useState<string | null>(null);
    const [searchQuery,      setSearchQuery]      = useState('');
    const [suggestions,      setSuggestions]      = useState<any[]>([]);
    const [isSearching,      setIsSearching]      = useState(false);
    const [mousePos,         setMousePos]         = useState({ x: 0, y: 0 });
    const [drawingMode,      setDrawingMode]      = useState<'polygon'|'circle'|'rectangle'>('polygon');
    const [isDrawing,        setIsDrawing]        = useState(false);
    const [dragStart,        setDragStart]        = useState<[number,number]|null>(null);

    /* ── helpers ── */
    const normalizeLngLat = (p: any): [number, number] => {
        if (!Array.isArray(p)) return [0, 0];
        const v1 = Number(p[0]), v2 = Number(p[1]);
        if (v1 > 24 && v1 < 38 && v2 > 21 && v2 < 32) return [v1, v2];
        if (v2 > 24 && v2 < 38 && v1 > 21 && v1 < 32) return [v2, v1];
        return [v1, v2];
    };
    const parseCoords = (val: any): [number,number][] => {
        if (!val) return [];
        try {
            const arr = typeof val === 'string' ? JSON.parse(val) : val;
            return (Array.isArray(arr) ? arr : []).map(normalizeLngLat);
        } catch { return []; }
    };

    const [points, setPoints] = useState<[number,number][]>(parseCoords(initialCoordinates));

    /* ── apply a polygon ring ── */
    const applyPolygon = (ring: [number,number][], areaName?: string) => {
        setPoints(ring);
        onChange(ring.map(p => [p[1], p[0]]));
        setIsDrawing(false);
        fitBounds(ring);
        if (areaName) {
            setDrawnArea(areaName);
            setTimeout(() => setDrawnArea(null), 3500);
        }
    };

    /* ── select neighborhood ── */
    const selectNeighborhood = (name: string) => {
        const bbox = AREA_BOUNDS[name];
        if (bbox) {
            const ring = bboxToPolygon(bbox);
            applyPolygon(ring, name);
            setShowNeighborhoods(false);
            // Try to refine with Nominatim in background
            refineFromNominatim(name, ring);
        }
    };

    /* ── refine with Nominatim (background, doesn't block UI) ── */
    const refineFromNominatim = async (name: string, fallbackRing: [number,number][]) => {
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name + ', Cairo, Egypt')}&format=json&limit=1&countrycodes=eg&polygon_geojson=1`;
            const res  = await fetch(url, { headers: { 'Accept-Language': 'ar,en' } });
            const data = await res.json();
            const loc  = data[0];
            if (!loc) return;
            let coords: [number,number][] = [];
            if (loc.geojson?.type === 'Polygon')      coords = loc.geojson.coordinates[0];
            if (loc.geojson?.type === 'MultiPolygon') coords = loc.geojson.coordinates[0][0];
            if (coords.length >= 4) {
                const refined: [number,number][] = coords.map(c => [Number(c[0]), Number(c[1])]);
                applyPolygon(refined, name);
            }
        } catch { /* keep bbox */ }
    };

    /* ── fullscreen ── */
    const toggleFullscreen = () => {
        setIsFullscreen(p => !p);
        setTimeout(() => map.current?.resize(), 120);
    };

    /* ── map init ── */
    useEffect(() => {
        if (map.current || !mapContainer.current) return;
        const sdk = window.maptilersdk;
        if (!sdk) return;
        sdk.config.apiKey = MAPTILER_KEY;
        map.current = new sdk.Map({
            container: mapContainer.current,
            style: sdk.MapStyle.STREETS,
            center: [31.2357, 30.0444],
            zoom: 11,
            attributionControl: false,
        });
        map.current.on('load', () => {
            setIsMapLoaded(true);
            const addSrc = (id: string) => map.current.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
            addSrc('current-zone');
            addSrc('existing-zones');
            map.current.addLayer({ id: 'current-zone-fill',     type: 'fill', source: 'current-zone',   paint: { 'fill-color': '#6366f1', 'fill-opacity': 0.22 } });
            map.current.addLayer({ id: 'current-zone-outline',  type: 'line', source: 'current-zone',   paint: { 'line-color': '#4338ca', 'line-width': 2.5 } });
            map.current.addLayer({ id: 'existing-zones-fill',   type: 'fill', source: 'existing-zones', paint: { 'fill-color': '#94a3b8', 'fill-opacity': 0.1 } });
            map.current.addLayer({ id: 'existing-zones-outline',type: 'line', source: 'existing-zones', paint: { 'line-color': '#94a3b8', 'line-width': 1.5 } });
            syncLayers();
            if (points.length > 0) fitBounds(points);
        });
        map.current.on('mousemove', (e: any) => {
            const rect = mapContainer.current?.getBoundingClientRect();
            if (rect) setMousePos({ x: e.originalEvent.clientX - rect.left, y: e.originalEvent.clientY - rect.top });
        });
        return () => { map.current?.remove(); map.current = null; };
    }, []);

    /* ── drawing click handler ── */
    useEffect(() => {
        if (!map.current) return;
        const onClick = (e: any) => {
            if (!isDrawing) return;
            const lngLat: [number,number] = [e.lngLat.lng, e.lngLat.lat];
            setPoints(prev => {
                let next: [number,number][];
                if (drawingMode === 'polygon') {
                    next = [...prev, lngLat];
                } else {
                    if (!dragStart) { setDragStart(lngLat); return prev; }
                    next = drawingMode === 'circle' ? genCircle(dragStart, lngLat) : genRect(dragStart, lngLat);
                    setDragStart(null);
                    setIsDrawing(false);
                }
                onChange(next.map(p => [p[1], p[0]]));
                return next;
            });
        };
        const onMove = (e: any) => {
            if (!isDrawing || !dragStart || drawingMode === 'polygon') return;
            const lngLat: [number,number] = [e.lngLat.lng, e.lngLat.lat];
            const draft = drawingMode === 'circle' ? genCircle(dragStart, lngLat) : genRect(dragStart, lngLat);
            map.current?.getSource('current-zone')?.setData({ type:'Feature', geometry:{ type:'Polygon', coordinates:[draft] } });
        };
        map.current.on('click', onClick);
        map.current.on('mousemove', onMove);
        return () => { map.current?.off('click', onClick); map.current?.off('mousemove', onMove); };
    }, [isDrawing, drawingMode, dragStart]);

    /* ── sync layers ── */
    const syncLayers = () => {
        if (!map.current) return;
        const src = map.current.getSource('current-zone');
        if (src) {
            const ring = points.length >= 3 ? [[...points, points[0]]] : [];
            src.setData({ type:'Feature', geometry:{ type:'Polygon', coordinates: ring } });
        }
        const esrc = map.current.getSource('existing-zones');
        if (esrc) {
            const feats = existingZones.filter(z => z.id !== editingZoneId).map(z => {
                const c = parseCoords(z.coordinates);
                return c.length >= 3 ? { type:'Feature', geometry:{ type:'Polygon', coordinates:[[...c, c[0]]] } } : null;
            }).filter(Boolean);
            esrc.setData({ type:'FeatureCollection', features: feats });
        }
    };
    useEffect(() => { syncLayers(); }, [points, existingZones, isMapLoaded]);

    /* ── geometry ── */
    const genCircle = (center: [number,number], edge: [number,number]): [number,number][] => {
        const ls = Math.cos(center[1] * Math.PI / 180);
        const r  = Math.sqrt(Math.pow((edge[0]-center[0])*ls,2)+Math.pow(edge[1]-center[1],2));
        return Array.from({length:65},(_,i)=>{const a=(i/64)*Math.PI*2;return[center[0]+(r/ls)*Math.cos(a),center[1]+r*Math.sin(a)] as [number,number];});
    };
    const genRect = (s:[number,number],e:[number,number]):[number,number][] => [[s[0],s[1]],[e[0],s[1]],[e[0],e[1]],[s[0],e[1]],[s[0],s[1]]];

    const fitBounds = (pts: [number,number][]) => {
        if (!map.current || pts.length === 0) return;
        const lngs = pts.map(p=>p[0]), lats = pts.map(p=>p[1]);
        map.current.fitBounds([[Math.min(...lngs),Math.min(...lats)],[Math.max(...lngs),Math.max(...lats)]], { padding:60, duration:800 });
    };

    /* ── search ── */
    const doSearch = async (q = searchQuery) => {
        if (!q.trim()) return;
        setIsSearching(true);
        try {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q+', Egypt')}&format=json&limit=5&countrycodes=eg&polygon_geojson=1`, { headers:{'Accept-Language':'ar,en'} });
            setSuggestions(await r.json());
        } finally { setIsSearching(false); }
    };
    useEffect(() => { const t = setTimeout(()=>{ if(searchQuery.length>1) doSearch(); },480); return ()=>clearTimeout(t); }, [searchQuery]);

    const applyLocation = (loc: any) => {
        setSuggestions([]);
        setSearchQuery(loc.display_name.split(',')[0]);
        let coords: [number,number][] = [];
        if (loc.geojson?.type==='Polygon')      coords = loc.geojson.coordinates[0];
        if (loc.geojson?.type==='MultiPolygon') coords = loc.geojson.coordinates[0][0];
        if (coords.length < 3 && loc.boundingbox) {
            const [s,n,w,e] = loc.boundingbox.map(Number);
            coords = [[w,s],[e,s],[e,n],[w,n],[w,s]];
        }
        if (coords.length >= 3) {
            applyPolygon(coords.map(c=>[Number(c[0]),Number(c[1])] as [number,number]));
        } else {
            map.current?.flyTo({ center:[Number(loc.lon),Number(loc.lat)], zoom:14 });
        }
    };

    const undoLast = () => { const n=points.slice(0,-1); setPoints(n); onChange(n.length>0?n.map(p=>[p[1],p[0]]):null); };
    const clearAll = () => { setPoints([]); onChange(null); setIsDrawing(false); setDragStart(null); };
    const startDraw = (mode: typeof drawingMode) => { setDrawingMode(mode); setDragStart(null); setIsDrawing(true); };
    const stopDraw  = () => { setIsDrawing(false); setDragStart(null); };

    return (
        <div ref={wrapperRef} className={`flex flex-col gap-3 transition-all duration-300 ${isFullscreen?'fixed inset-0 z-[9999] bg-slate-950 p-3':''}`}>

            {/* ── Toolbar ── */}
            <div className="flex gap-2 items-stretch">
                <button
                    onClick={() => setShowNeighborhoods(v=>!v)}
                    className={`flex items-center gap-2 px-4 h-11 rounded-2xl border-2 font-black text-sm transition-all flex-shrink-0 ${showNeighborhoods?'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200':'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-700'}`}
                >
                    <MapPin className="w-4 h-4" />
                    <span className="hidden sm:inline">أحياء القاهرة والجيزة</span>
                    <span className="sm:hidden">الأحياء</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showNeighborhoods?'rotate-180':''}`} />
                </button>

                <div className="relative flex-1">
                    <div className={`flex items-center bg-white rounded-2xl border-2 transition-all shadow-sm h-11 overflow-hidden ${isSearching?'border-indigo-400':'border-slate-200 focus-within:border-indigo-400'}`}>
                        <Search className="w-4 h-4 text-slate-400 mr-3 flex-shrink-0" />
                        <Input
                            placeholder="ابحث عن حي أو شارع... (يرسم تلقائياً)"
                            value={searchQuery}
                            onChange={e=>setSearchQuery(e.target.value)}
                            onKeyDown={e=>e.key==='Enter'&&doSearch()}
                            className="h-full border-none bg-transparent font-bold text-sm focus-visible:ring-0 rounded-none flex-1 min-w-0 px-0"
                        />
                        {isSearching && <Loader2 className="w-4 h-4 animate-spin text-indigo-500 ml-2 flex-shrink-0" />}
                        {searchQuery && !isSearching && (
                            <button onClick={()=>{setSearchQuery('');setSuggestions([]);}} className="px-3 text-slate-400 hover:text-slate-700 flex-shrink-0"><X className="w-4 h-4"/></button>
                        )}
                    </div>
                    {suggestions.length > 0 && (
                        <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden z-[500]">
                            {suggestions.map((s,i)=>(
                                <div key={i} onClick={()=>applyLocation(s)} className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-0 transition-colors flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5"><MapPin className="w-3.5 h-3.5 text-indigo-600"/></div>
                                    <div className="min-w-0">
                                        <p className="font-black text-slate-900 text-sm">{s.display_name.split(',')[0]}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{s.display_name.split(',').slice(1,3).join(', ')}</p>
                                    </div>
                                    <span className="mr-auto self-center text-[10px] bg-indigo-100 text-indigo-600 font-black px-2 py-0.5 rounded-full flex-shrink-0">رسم تلقائي</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button onClick={toggleFullscreen} title={isFullscreen?'تصغير':'تكبير كامل'}
                    className="h-11 w-11 rounded-2xl border-2 border-slate-200 bg-white hover:border-indigo-400 hover:text-indigo-600 flex items-center justify-center flex-shrink-0 transition-all">
                    {isFullscreen?<Minimize2 className="w-4 h-4"/>:<Maximize2 className="w-4 h-4"/>}
                </button>
            </div>

            {/* ── Neighborhoods Panel (inline — never overflows) ── */}
            {showNeighborhoods && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="px-4 py-2.5 border-b border-slate-50 flex items-center gap-2 bg-slate-50/60">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0"/>
                        <p className="text-xs font-black text-slate-600">اضغط على الحي لتحديد حدوده على الخريطة مباشرة</p>
                    </div>
                    <div className="p-3 max-h-[260px] overflow-y-auto space-y-2">
                        {NEIGHBORHOODS.map(group=>(
                            <div key={group.group}>
                                <button
                                    onClick={()=>setExpandedGroup(expandedGroup===group.group?null:group.group)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black mb-1.5 transition-colors ${colorStyle[group.color].header}`}
                                >
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedGroup===group.group?'rotate-180':''}`}/>
                                    <span>{group.group}</span>
                                </button>
                                {expandedGroup===group.group && (
                                    <div className="flex flex-wrap gap-1.5 px-1 pb-1">
                                        {group.areas.map(area=>(
                                            <button
                                                key={area}
                                                onClick={()=>selectNeighborhood(area)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all active:scale-95 hover:scale-105 flex items-center gap-1.5 ${colorStyle[group.color].chip}`}
                                            >
                                                <MapPin className="w-3 h-3 opacity-50"/>
                                                {area}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Map Container ── */}
            <div className={`relative w-full rounded-3xl overflow-hidden border-2 border-white shadow-2xl bg-slate-100 ${isFullscreen?'flex-1':'h-[480px] sm:h-[540px]'} ${isDrawing?'cursor-crosshair':''}`}>
                <div ref={mapContainer} className="absolute inset-0 w-full h-full"/>

                {/* Crosshair overlay */}
                {isDrawing && isMapLoaded && (
                    <div className="absolute inset-0 pointer-events-none z-[102] overflow-hidden">
                        <div className="absolute left-0 right-0 h-px bg-indigo-500/25" style={{top:mousePos.y}}/>
                        <div className="absolute top-0 bottom-0 w-px bg-indigo-500/25" style={{left:mousePos.x}}/>
                        <div className="absolute w-5 h-5 border-2 border-indigo-600 rounded-md -translate-x-1/2 -translate-y-1/2" style={{left:mousePos.x,top:mousePos.y}}>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-indigo-600 rounded-full shadow-[0_0_5px_rgba(79,70,229,0.9)]"/>
                        </div>
                    </div>
                )}

                {/* Loading state */}
                {!isMapLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md z-[103]">
                        <div className="relative"><Loader2 className="w-12 h-12 animate-spin text-indigo-600"/><Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400"/></div>
                        <p className="mt-4 font-black text-slate-800">جاري تحميل الخريطة...</p>
                    </div>
                )}

                {/* Draw tools — Left */}
                <div className="absolute top-3 left-3 z-[101]">
                    <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-white/80 flex flex-col gap-1">
                        {([
                            {mode:'polygon'   as const, Icon:Hexagon,     title:'مضلع — نقطة بنقطة'},
                            {mode:'circle'    as const, Icon:CircleIcon,  title:'دائرة — مركز وسحب'},
                            {mode:'rectangle' as const, Icon:Square,      title:'مستطيل — زاوية لزاوية'},
                        ]).map(({mode,Icon,title})=>(
                            <button key={mode} title={title}
                                onClick={()=>isDrawing&&drawingMode===mode?stopDraw():startDraw(mode)}
                                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${isDrawing&&drawingMode===mode?'bg-indigo-600 text-white shadow-md scale-105':'hover:bg-indigo-50 text-slate-500 hover:text-indigo-600'}`}>
                                <Icon className="w-[18px] h-[18px]"/>
                            </button>
                        ))}
                        <div className="h-px bg-slate-100 mx-1"/>
                        <button title="منطقة سريعة في المركز"
                            onClick={()=>{
                                if(!map.current) return;
                                const c=map.current.getCenter(),d=0.012;
                                const pts:[number,number][] = [[c.lng-d,c.lat-d],[c.lng+d,c.lat-d],[c.lng+d,c.lat+d],[c.lng-d,c.lat+d]];
                                setPoints(pts); onChange(pts.map(p=>[p[1],p[0]])); setIsDrawing(false);
                            }}
                            className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-all">
                            <Layers className="w-[18px] h-[18px]"/>
                        </button>
                        {isDrawing && (<>
                            <div className="h-px bg-slate-100 mx-1"/>
                            <button title="إلغاء الرسم" onClick={stopDraw}
                                className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-red-50 text-red-400 hover:text-red-600 transition-all">
                                <X className="w-[18px] h-[18px]"/>
                            </button>
                        </>)}
                    </div>
                </div>

                {/* Zoom — Right */}
                <div className="absolute top-3 right-3 z-[101] flex flex-col gap-1.5">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/80 flex flex-col overflow-hidden">
                        <button onClick={()=>map.current?.zoomIn()}  className="h-10 w-10 flex items-center justify-center hover:bg-slate-50 text-slate-600 border-b border-slate-100 transition-colors"><ZoomIn  className="w-[18px] h-[18px]"/></button>
                        <button onClick={()=>map.current?.zoomOut()} className="h-10 w-10 flex items-center justify-center hover:bg-slate-50 text-slate-600 transition-colors"><ZoomOut className="w-[18px] h-[18px]"/></button>
                    </div>
                    <button title="العودة للقاهرة" onClick={()=>map.current?.flyTo({center:[31.2357,30.0444],zoom:11})}
                        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/80 h-10 w-10 flex items-center justify-center hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all">
                        <Navigation className="w-[18px] h-[18px]"/>
                    </button>
                </div>

                {/* Drawing banner */}
                {isDrawing && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[101] pointer-events-none">
                        <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-full shadow-xl text-xs font-black flex items-center gap-2 whitespace-nowrap border border-white/20">
                            <Crosshair className="w-3.5 h-3.5 animate-pulse"/>
                            {drawingMode==='polygon'?`انقر لتحديد النقاط • ${points.length} نقطة`:dragStart?'انقر لتحديد الحجم':'انقر لتحديد المركز'}
                        </div>
                    </div>
                )}

                {/* Area drawn notification */}
                {drawnArea && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[102] pointer-events-none">
                        <div className="bg-emerald-600 text-white px-4 py-1.5 rounded-full shadow-xl text-xs font-black flex items-center gap-2 whitespace-nowrap animate-in fade-in">
                            <Sparkles className="w-3.5 h-3.5"/>
                            تم تحديد {drawnArea} ✓
                        </div>
                    </div>
                )}

                {/* Bottom stats */}
                {points.length > 0 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[101] animate-in slide-in-from-bottom-2">
                        <div className="bg-slate-900/95 backdrop-blur-xl text-white px-2 py-1.5 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-1">
                            {points.length >= 3 && (
                                <div className="px-3 py-1 border-l border-white/10 flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"/>
                                    <span className="text-[10px] text-emerald-300 font-black">محدد</span>
                                </div>
                            )}
                            <div className="px-3 py-1 border-l border-white/10 flex items-center gap-1.5">
                                <span className="font-black text-indigo-300">{points.length}</span>
                                <span className="text-[10px] text-white/50">نقطة</span>
                            </div>
                            <div className="flex gap-1 px-1.5">
                                <button onClick={undoLast} title="تراجع" disabled={points.length===0}
                                    className="h-8 w-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30">
                                    <Undo2 className="w-3.5 h-3.5"/>
                                </button>
                                <button onClick={()=>fitBounds(points)} title="ملاءمة الشاشة"
                                    className="h-8 w-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
                                    <Map className="w-3.5 h-3.5"/>
                                </button>
                                <button onClick={clearAll} title="مسح الكل"
                                    className="h-8 w-8 rounded-xl flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
                                    <Trash2 className="w-3.5 h-3.5"/>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty hint */}
                {isMapLoaded && points.length===0 && !isDrawing && !drawnArea && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-md text-slate-500 px-4 py-2 rounded-2xl shadow border border-slate-100 text-[11px] font-bold whitespace-nowrap">
                            اختر حياً من القائمة أعلاه أو ارسم المنطقة يدوياً
                        </div>
                    </div>
                )}
            </div>

            {/* ── Draw mode row ── */}
            <div className="flex flex-wrap gap-2">
                {([
                    {mode:'polygon'   as const, label:'رسم مضلع',    sub:'نقطة بنقطة',   Icon:Hexagon},
                    {mode:'circle'    as const, label:'رسم دائرة',   sub:'مركز وسحب',    Icon:CircleIcon},
                    {mode:'rectangle' as const, label:'رسم مستطيل', sub:'زاوية لزاوية', Icon:Square},
                ]).map(({mode,label,sub,Icon})=>(
                    <button key={mode}
                        onClick={()=>isDrawing&&drawingMode===mode?stopDraw():startDraw(mode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 text-xs font-bold transition-all ${isDrawing&&drawingMode===mode?'bg-indigo-600 text-white border-indigo-600 shadow-md':'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-700'}`}>
                        <Icon className="w-3.5 h-3.5"/>
                        <span>{label}</span>
                        <span className={`text-[10px] font-normal ${isDrawing&&drawingMode===mode?'text-white/70':'text-slate-400'}`}>{sub}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
