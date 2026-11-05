/// <reference types="vite/client" />

// Global namespace React
declare namespace React {
  export type ReactNode = any;
  export type ElementType = any;
  export type ComponentType<P = any> = any;
  export type FC<P = any> = (props: P) => any;
  export type FormEvent<T = any> = any;
  export type MouseEvent<T = any> = any;
  export type KeyboardEvent<T = any> = any;
  export type ChangeEvent<T = any> = any;
  export type HTMLAttributes<T> = any;
  export type ButtonHTMLAttributes<T> = any;
  export type InputHTMLAttributes<T> = any;
  export type ThHTMLAttributes<T> = any;
  export type TdHTMLAttributes<T> = any;
  export type ElementRef<T> = any;
  export type ComponentPropsWithoutRef<T> = any;

  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useRef<T>(initialValue?: T): { current: T };
  export function forwardRef<T, P = {}>(
    render: (props: P, ref: any) => any
  ): ((props: P & { ref?: any }) => any) & { displayName?: string };
  export function createContext<T>(defaultValue: T): any;
  export function useContext<T>(context: any): T;
  export function useMemo<T>(factory: () => T, deps: any[] | undefined): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;

  export const StrictMode: any;
  export const Fragment: any;
}

declare module 'react' {
  export = React;
  export as namespace React;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react/jsx-dev-runtime' {
  export const jsxDEV: any;
  export const Fragment: any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface Element extends any {}
  interface ElementClass extends any {}
}

declare module 'react-dom/client' {
  export function createRoot(container: Element | DocumentFragment): {
    render(children: any): void;
    unmount(): void;
  };
}

// Global namespace L (Leaflet)
declare namespace L {
  export type Map = any;
  export type Polygon = any;
  export type Marker = any;
  export type Polyline = any;
  export type LeafletMouseEvent = any;
  export type DivIcon = any;
  export type Layer = any;
  export type LatLng = any;
  export type TileLayer = any;
  export type LayerGroup = any;
  export type Circle = any;
  export type CircleMarker = any;

  export const map: any;
  export const control: any;
  export const tileLayer: any;
  export const polygon: any;
  export const marker: any;
  export const divIcon: any;
  export const polyline: any;
  export const layerGroup: any;
  export const circle: any;
  export const circleMarker: any;
  export const latLngBounds: any;
}

declare module 'leaflet' {
  export = L;
  export as namespace L;
}

declare module 'lucide-react' {
  export type LucideIcon = any;
  export const Menu: any;
  export const User: any;
  export const LayoutGrid: any;
  export const List: any;
  export const LogOut: any;
  export const ChevronDown: any;
  export const ChevronLeft: any;
  export const ChevronRight: any;
  export const FileText: any;
  export const QrCode: any;
  export const BatteryWarning: any;
  export const Shield: any;
  export const Plus: any;
  export const Bell: any;
  export const Sun: any;
  export const Moon: any;
  export const Footprints: any;
  export const School: any;
  export const UserCheck: any;
  export const Search: any;
  export const PenTool: any;
  export const Check: any;
  export const X: any;
  export const MapPin: any;
  export const Heart: any;
  export const Battery: any;
  export const Radio: any;
  export const Users: any;
  export const CheckCircle2: any;
  export const Watch: any;
  export const Edit3: any;
  export const Download: any;
  export const Printer: any;
  export const CheckCircle: any;
  export const Clock: any;
  export const AlertTriangle: any;
  export const Edit2: any;
  export const UserPlus: any;
  export const FileSpreadsheet: any;
  export const ArrowLeftRight: any;
  export const Trash2: any;
  export const Thermometer: any;
  export const BatteryCharging: any;
  export const ShieldAlert: any;
  export const AlertOctagon: any;
  export const Play: any;
  export const Navigation: any;
  export const Home: any;
  export const Dumbbell: any;
  export const BarChart3: any;
  export const ShieldCheck: any;
  export const Map: any;
  export const ClipboardCheck: any;
  export const Smartphone: any;
  export const Layers: any;
  export const Crosshair: any;
  export const Activity: any;
  export const Compass: any;
  export const ZoomIn: any;
  export const ZoomOut: any;
  export const Maximize2: any;
  export const Minimize2: any;
  export const Ruler: any;
  export const Square: any;
  export const Circle: any;
  export const Sparkles: any;
  export const Filter: any;
  export const RefreshCw: any;
  export const AlertCircle: any;
  export const Volume2: any;
  export const Eye: any;
  export const Navigation2: any;
  export const Phone: any;
  export const Flame: any;
  export const Zap: any;
  export const MapPinned: any;
  export const Undo: any;
  export const RotateCcw: any;
  export const Pause: any;
  export const Copy: any;
  export const ChevronRight: any;
  export const Info: any;
  export const ExternalLink: any;
}

declare module '@radix-ui/react-slot' {
  export const Slot: any;
}

declare module '@radix-ui/react-dialog' {
  export const Root: any;
  export const Trigger: any;
  export const Portal: any;
  export const Overlay: any;
  export const Content: any;
  export const Close: any;
  export const Title: any;
  export const Description: any;
}

declare module '@radix-ui/react-tabs' {
  export const Root: any;
  export const List: any;
  export const Trigger: any;
  export const Content: any;
}

declare module '@radix-ui/react-label' {
  export const Root: any;
}

declare module 'vite' {
  export function defineConfig(config: any): any;
  export type UserConfig = any;
}

declare module '@vitejs/plugin-react' {
  export default function react(options?: any): any;
}

declare module 'path' {
  export function resolve(...args: string[]): string;
  export function join(...args: string[]): string;
}

declare const __dirname: string;

