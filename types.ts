export interface Step {
  id: number;
  name: string;
}

export type FootSide = 'right' | 'left';

export interface PatientData {
  nombre: string;
  edad: number | '';
  sexo: 'M' | 'F' | 'X' | '';
  unidadCalzado: 'MX' | 'US' | 'EU' | 'Mondopoint' | '';
  medidaCalzado: string;
  peso: number | '';
  talla: number | '';
  imc: number | '';
  tipoProblema: 'diabetico' | 'artritico' | 'deportista' | 'normal' | '';
  email: string;
  whatsapp: string;
  preferenciaContacto: 'whatsapp' | 'email' | 'llamada';
  cuestionarioRespuestas: any; // Simplified for this context
}

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface FootDataSide {
  plantar: string | null;
  medial: string | null;
  posterior: string | null;
  shoeWear: string | null;
  plantarConfirmed: boolean;
  selectionRect: SelectionRect | null;
  footMeasurement: number | null;
  step1Image: string | null; // Cropped selection
  step2Canvas: string | null; // Grayscale
  step3Canvas: string | null; // Heatmap
  medialTrianglePoints: { p1: Point; p2: Point; p3: Point } | null;
  posteriorLinePoints: { calf: [Point, Point], heel: [Point, Point] } | null;
}

export interface FootData {
  right: FootDataSide;
  left: FootDataSide;
}

export interface FootMetrics {
    antepie: number;
    retropie: number;
    mediopie: number;
    indiceArco: number;
    archType: 'plano' | 'cavo' | 'neutro';
    contactArea: {
        length: number;
        width: number;
        area: number;
    } | null;
    totalLoad: number;
    weightedPressure: number;
    navicularAngle: number | null;
    rearfootAngle: number | null;
    midfootPressureRatio: number | null;
}

export interface ReportSummary {
  general: string;
  pieDerecho: string;
  pieIzquierdo: string;
  balance: string;
}

export interface ReportRecommendations {
  cnc: string;
  shoes: string[];
  exercises: string[];
}

export interface ReportData {
  summary: ReportSummary;
  recommendations: ReportRecommendations;
}