import type { Step, PatientData, FootData } from './types.ts';

export const STEPS: Step[] = [
  { id: 1, name: 'Consentimiento' },
  { id: 2, name: 'Información Personal' },
  { id: 3, name: 'Pie Derecho' },
  { id: 4, name: 'Pie Izquierdo' },
  { id: 5, name: 'Desgaste Calzado' },
  { id: 6, name: 'Resultados' },
];

export const initialPatientData: PatientData = {
  nombre: '',
  edad: '',
  sexo: '',
  unidadCalzado: 'MX',
  medidaCalzado: '',
  peso: '',
  talla: '',
  imc: '',
  tipoProblema: '',
  email: '',
  whatsapp: '',
  preferenciaContacto: 'whatsapp',
  cuestionarioRespuestas: {},
};

const initialFootDataSide = {
  plantar: null,
  medial: null,
  posterior: null,
  shoeWear: null,
  plantarConfirmed: false,
  selectionRect: null,
  footMeasurement: null,
  step1Image: null,
  step2Canvas: null,
  step3Canvas: null,
  medialTrianglePoints: null,
  posteriorLinePoints: null,
};

export const initialFootData: FootData = {
  right: { ...initialFootDataSide },
  left: { ...initialFootDataSide },
};