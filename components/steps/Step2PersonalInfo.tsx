import React, { useEffect } from 'react';
import type { PatientData } from '../../types.ts';

interface Step2PersonalInfoProps {
  patientData: PatientData;
  updatePatientData: (data: Partial<PatientData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const Step2PersonalInfo: React.FC<Step2PersonalInfoProps> = ({ patientData, updatePatientData, onNext, onBack }) => {

  const inputBaseStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";
  const selectBaseStyle = `${inputBaseStyle} bg-white`;
  const readOnlyInputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100";
  const radioCheckboxBaseStyle = "h-4 w-4 text-primary-800 border-gray-300 rounded focus:ring-primary-500";
  const smallNumericInputStyle = "w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";

  useEffect(() => {
    const { peso, talla } = patientData;
    if (peso && talla) {
      const imc = Number(peso) / Math.pow(Number(talla) / 100, 2);
      updatePatientData({ imc: parseFloat(imc.toFixed(1)) });
    }
  }, [patientData.peso, patientData.talla, updatePatientData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isNumeric = ['edad', 'peso', 'talla'].includes(name);
    updatePatientData({ [name]: isNumeric && value !== '' ? parseFloat(value) : value });
  };
  
  const handleCuestionarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value, dataset } = e.target;
    const perfil = dataset.perfil;

    if (!perfil) return;

    let currentAnswers = patientData.cuestionarioRespuestas[perfil] || {};
    let newAnswer;

    if (type === 'checkbox') {
        const currentSelection = currentAnswers[name] || [];
        if (checked) {
            newAnswer = [...currentSelection, value];
        } else {
            newAnswer = currentSelection.filter((item: string) => item !== value);
        }
    } else {
        newAnswer = value;
    }
    
    updatePatientData({
        cuestionarioRespuestas: {
            ...patientData.cuestionarioRespuestas,
            [perfil]: {
                ...currentAnswers,
                [name]: newAnswer
            }
        }
    });
  };


  const isFormValid = () => {
    return patientData.nombre && patientData.edad && patientData.sexo && patientData.medidaCalzado && patientData.tipoProblema && patientData.email && patientData.peso && patientData.talla;
  };

  const PerfilDiabetico: React.FC = () => (
    <div className="space-y-4 p-4 border border-yellow-300 rounded-lg bg-yellow-50 mt-4">
        <h3 className="font-semibold text-yellow-800">Cuestionario: Perfil Diabético</h3>
        <div className="space-y-4 text-sm text-gray-700">
            <div>
                <p className="font-medium mb-1">¿Siente alguno de estos síntomas en sus pies? (Neuropatía)</p>
                <div className="flex flex-col gap-1 pl-4">
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="diabetico" name="dm_sensibilidad" value="si" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.diabetico?.dm_sensibilidad === 'si'} className={radioCheckboxBaseStyle} /> Sí, siento entumecimiento, hormigueo o ardor</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="diabetico" name="dm_sensibilidad" value="no" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.diabetico?.dm_sensibilidad === 'no'} className={radioCheckboxBaseStyle} /> No, mi sensibilidad es normal</label>
                </div>
            </div>
            <div>
                <p className="font-medium mb-1">Marque si ha tenido o tiene alguna de las siguientes condiciones:</p>
                <div className="flex flex-col gap-1 pl-4">
                    <label className="flex items-center gap-2"><input type="checkbox" data-perfil="diabetico" name="dm_condiciones" value="ulcera_previa" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.diabetico?.dm_condiciones?.includes('ulcera_previa')} className={radioCheckboxBaseStyle} /> Antecedente de úlceras</label>
                    <label className="flex items-center gap-2"><input type="checkbox" data-perfil="diabetico" name="dm_condiciones" value="amputacion_previa" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.diabetico?.dm_condiciones?.includes('amputacion_previa')} className={radioCheckboxBaseStyle} /> Antecedente de amputación</label>
                    <label className="flex items-center gap-2"><input type="checkbox" data-perfil="diabetico" name="dm_condiciones" value="deformidades" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.diabetico?.dm_condiciones?.includes('deformidades')} className={radioCheckboxBaseStyle} /> Deformidades (dedos en garra, juanetes, etc.)</label>
                    <label className="flex items-center gap-2"><input type="checkbox" data-perfil="diabetico" name="dm_condiciones" value="charcot" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.diabetico?.dm_condiciones?.includes('charcot')} className={radioCheckboxBaseStyle} /> Diagnóstico de pie de Charcot</label>
                </div>
            </div>
            <div>
                <p className="font-medium mb-1">¿Cómo es su control de glucosa habitualmente?</p>
                <div className="flex flex-col gap-1 pl-4">
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="diabetico" name="dm_glucosa" value="bien_controlado" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.diabetico?.dm_glucosa === 'bien_controlado'} className={radioCheckboxBaseStyle} /> Bien controlado (HbA1c &lt; 7%)</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="diabetico" name="dm_glucosa" value="regular" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.diabetico?.dm_glucosa === 'regular'} className={radioCheckboxBaseStyle} /> Regular</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="diabetico" name="dm_glucosa" value="mal_controlado" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.diabetico?.dm_glucosa === 'mal_controlado'} className={radioCheckboxBaseStyle} /> Mal controlado</label>
                </div>
            </div>
            <div>
                <p className="font-medium mb-1">¿Qué tipo de calzado utiliza la mayor parte del día?</p>
                <div className="flex flex-col gap-1 pl-4">
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="diabetico" name="dm_calzado" value="especializado" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.diabetico?.dm_calzado === 'especializado'} className={radioCheckboxBaseStyle} /> Calzado especializado para diabético</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="diabetico" name="dm_calzado" value="tenis_comodos" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.diabetico?.dm_calzado === 'tenis_comodos'} className={radioCheckboxBaseStyle} /> Tenis cómodos y anchos</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="diabetico" name="dm_calzado" value="vestir" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.diabetico?.dm_calzado === 'vestir'} className={radioCheckboxBaseStyle} /> Zapato de vestir</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="diabetico" name="dm_calzado" value="abierto" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.diabetico?.dm_calzado === 'abierto'} className={radioCheckboxBaseStyle} /> Sandalias / Calzado abierto</label>
                </div>
            </div>
            <div>
                <p className="font-medium mb-1">¿Cómo describiría su nivel de actividad diaria?</p>
                <div className="flex flex-col gap-1 pl-4">
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="diabetico" name="dm_actividad" value="sedentario" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.diabetico?.dm_actividad === 'sedentario'} className={radioCheckboxBaseStyle} /> Sedentario (mayormente sentado)</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="diabetico" name="dm_actividad" value="ligero" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.diabetico?.dm_actividad === 'ligero'} className={radioCheckboxBaseStyle} /> Ligero (caminatas ocasionales)</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="diabetico" name="dm_actividad" value="activo" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.diabetico?.dm_actividad === 'activo'} className={radioCheckboxBaseStyle} /> Activo (camina regularmente, trabajo de pie)</label>
                </div>
            </div>
        </div>
    </div>
  );

  const PerfilDeportista: React.FC = () => (
     <div className="space-y-4 p-4 border border-blue-300 rounded-lg bg-blue-50 mt-4">
        <h3 className="font-semibold text-blue-800">Cuestionario: Perfil Deportista</h3>
        <div className="space-y-4 text-sm text-gray-700">
            <div>
                <p className="font-medium mb-1">¿Qué deporte o actividad principal realiza?</p>
                <div className="flex flex-col gap-1 pl-4">
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="deportista" name="dep_tipo" value="correr" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_tipo === 'correr'} className={radioCheckboxBaseStyle} /> Correr / Atletismo</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="deportista" name="dep_tipo" value="equipo" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_tipo === 'equipo'} className={radioCheckboxBaseStyle} /> Deportes de equipo (fútbol, baloncesto, etc.)</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="deportista" name="dep_tipo" value="gym" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_tipo === 'gym'} className={radioCheckboxBaseStyle} /> Gimnasio / Crossfit</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="deportista" name="dep_tipo" value="otro" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_tipo === 'otro'} className={radioCheckboxBaseStyle} /> Otro</label>
                </div>
            </div>
            <div>
                <p className="font-medium mb-1">¿Cuál es su volumen de entrenamiento semanal?</p>
                <div className="pl-4">
                {patientData.cuestionarioRespuestas?.deportista?.dep_tipo === 'correr' ? (
                     <label className="flex items-center gap-2">
                        <span>Kilómetros / semana:</span>
                        <input type="number" data-perfil="deportista" name="dep_volumen_km" value={patientData.cuestionarioRespuestas.deportista?.dep_volumen_km || ''} onChange={handleCuestionarioChange} className={smallNumericInputStyle} />
                    </label>
                ) : (
                    <label className="flex items-center gap-2">
                        <span>Horas / semana:</span>
                        <input type="number" data-perfil="deportista" name="dep_volumen_hrs" value={patientData.cuestionarioRespuestas.deportista?.dep_volumen_hrs || ''} onChange={handleCuestionarioChange} className={smallNumericInputStyle} />
                    </label>
                )}
                </div>
            </div>
             <div>
                <p className="font-medium mb-1">Marque si ha tenido diagnóstico o síntomas de alguna de las siguientes lesiones:</p>
                <div className="flex flex-col gap-1 pl-4">
                    <label className="flex items-center gap-2"><input type="checkbox" data-perfil="deportista" name="dep_lesiones" value="fascitis" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_lesiones?.includes('fascitis')} className={radioCheckboxBaseStyle} /> Fascitis plantar (dolor en el talón/arco)</label>
                    <label className="flex items-center gap-2"><input type="checkbox" data-perfil="deportista" name="dep_lesiones" value="periostitis" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_lesiones?.includes('periostitis')} className={radioCheckboxBaseStyle} /> Periostitis tibial (dolor en espinillas)</label>
                    <label className="flex items-center gap-2"><input type="checkbox" data-perfil="deportista" name="dep_lesiones" value="esguinces" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_lesiones?.includes('esguinces')} className={radioCheckboxBaseStyle} /> Esguinces de tobillo recurrentes</label>
                    <label className="flex items-center gap-2"><input type="checkbox" data-perfil="deportista" name="dep_lesiones" value="tendinitis" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_lesiones?.includes('tendinitis')} className={radioCheckboxBaseStyle} /> Tendinitis de Aquiles</label>
                </div>
            </div>
            <div>
                <p className="font-medium mb-1">¿Sobre qué superficie entrena principalmente?</p>
                <div className="flex flex-col gap-1 pl-4">
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="deportista" name="dep_superficie" value="asfalto" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_superficie === 'asfalto'} className={radioCheckboxBaseStyle} /> Asfalto / Concreto</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="deportista" name="dep_superficie" value="pista" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_superficie === 'pista'} className={radioCheckboxBaseStyle} /> Pista de atletismo / Tartán</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="deportista" name="dep_superficie" value="cesped" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_superficie === 'cesped'} className={radioCheckboxBaseStyle} /> Césped / Tierra</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="deportista" name="dep_superficie" value="gimnasio" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_superficie === 'gimnasio'} className={radioCheckboxBaseStyle} /> Gimnasio / Superficie artificial</label>
                </div>
            </div>
            <div>
                <p className="font-medium mb-1">¿Cuál es su principal objetivo deportivo actual?</p>
                 <div className="flex flex-col gap-1 pl-4">
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="deportista" name="dep_objetivo" value="rendimiento" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_objetivo === 'rendimiento'} className={radioCheckboxBaseStyle} /> Competencia / Rendimiento</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="deportista" name="dep_objetivo" value="salud" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_objetivo === 'salud'} className={radioCheckboxBaseStyle} /> Salud / Recreación</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="deportista" name="dep_objetivo" value="rehabilitacion" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_objetivo === 'rehabilitacion'} className={radioCheckboxBaseStyle} /> Rehabilitación de lesión</label>
                </div>
            </div>
            <div>
                <p className="font-medium mb-1">¿Usa calzado especializado para su deporte?</p>
                 <div className="flex flex-col gap-1 pl-4">
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="deportista" name="dep_calzado_esp" value="si" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_calzado_esp === 'si'} className={radioCheckboxBaseStyle} /> Sí, siempre</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="deportista" name="dep_calzado_esp" value="a_veces" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_calzado_esp === 'a_veces'} className={radioCheckboxBaseStyle} /> A veces</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="deportista" name="dep_calzado_esp" value="no" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.deportista?.dep_calzado_esp === 'no'} className={radioCheckboxBaseStyle} /> No, uso calzado genérico</label>
                </div>
            </div>
        </div>
    </div>
  );

  const PerfilArtritico: React.FC = () => (
      <div className="space-y-4 p-4 border border-red-300 rounded-lg bg-red-50 mt-4">
        <h3 className="font-semibold text-red-800">Cuestionario: Perfil Artrítico</h3>
        <div className="space-y-4 text-sm text-gray-700">
            <div>
                <p className="font-medium mb-1">¿Experimenta rigidez en sus pies por la mañana que mejora con el movimiento?</p>
                <div className="flex flex-col gap-1 pl-4">
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="artritico" name="ar_rigidez_matutina" value="si" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.artritico?.ar_rigidez_matutina === 'si'} className={radioCheckboxBaseStyle} /> Sí, regularmente</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="artritico" name="ar_rigidez_matutina" value="no" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.artritico?.ar_rigidez_matutina === 'no'} className={radioCheckboxBaseStyle} /> No, o muy raramente</label>
                </div>
            </div>
            <div>
                <p className="font-medium mb-1">¿En qué zonas siente principalmente el dolor o la inflamación? (Marque todas las que apliquen)</p>
                <div className="flex flex-col gap-1 pl-4">
                    <label className="flex items-center gap-2"><input type="checkbox" data-perfil="artritico" name="ar_zonas_dolor" value="dedos" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.artritico?.ar_zonas_dolor?.includes('dedos')} className={radioCheckboxBaseStyle} /> Articulaciones de los dedos</label>
                    <label className="flex items-center gap-2"><input type="checkbox" data-perfil="artritico" name="ar_zonas_dolor" value="juanete" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.artritico?.ar_zonas_dolor?.includes('juanete')} className={radioCheckboxBaseStyle} /> Área del juanete (dedo gordo)</label>
                    <label className="flex items-center gap-2"><input type="checkbox" data-perfil="artritico" name="ar_zonas_dolor" value="empeine" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.artritico?.ar_zonas_dolor?.includes('empeine')} className={radioCheckboxBaseStyle} /> Empeine / Mediopié</label>
                    <label className="flex items-center gap-2"><input type="checkbox" data-perfil="artritico" name="ar_zonas_dolor" value="tobillo" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.artritico?.ar_zonas_dolor?.includes('tobillo')} className={radioCheckboxBaseStyle} /> Tobillo</label>
                </div>
            </div>
            <div>
                <p className="font-medium mb-1">¿Qué actividades le resultan más difíciles debido al dolor en los pies? (Marque todas las que apliquen)</p>
                <div className="flex flex-col gap-1 pl-4">
                    <label className="flex items-center gap-2"><input type="checkbox" data-perfil="artritico" name="ar_actividades_dificiles" value="caminar_largo" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.artritico?.ar_actividades_dificiles?.includes('caminar_largo')} className={radioCheckboxBaseStyle} /> Caminar largas distancias</label>
                    <label className="flex items-center gap-2"><input type="checkbox" data-perfil="artritico" name="ar_actividades_dificiles" value="estar_de_pie" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.artritico?.ar_actividades_dificiles?.includes('estar_de_pie')} className={radioCheckboxBaseStyle} /> Estar de pie por mucho tiempo</label>
                    <label className="flex items-center gap-2"><input type="checkbox" data-perfil="artritico" name="ar_actividades_dificiles" value="escaleras" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.artritico?.ar_actividades_dificiles?.includes('escaleras')} className={radioCheckboxBaseStyle} /> Subir/bajar escaleras</label>
                    <label className="flex items-center gap-2"><input type="checkbox" data-perfil="artritico" name="ar_actividades_dificiles" value="usar_calzado" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.artritico?.ar_actividades_dificiles?.includes('usar_calzado')} className={radioCheckboxBaseStyle} /> Usar cierto tipo de calzado</label>
                </div>
            </div>
             <div>
                <p className="font-medium mb-1">¿Qué tipo de calzado le resulta más cómodo o utiliza con más frecuencia?</p>
                <div className="flex flex-col gap-1 pl-4">
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="artritico" name="ar_calzado" value="ortopedico" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.artritico?.ar_calzado === 'ortopedico'} className={radioCheckboxBaseStyle} /> Calzado ortopédico / terapéutico</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="artritico" name="ar_calzado" value="tenis_ancho" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.artritico?.ar_calzado === 'tenis_ancho'} className={radioCheckboxBaseStyle} /> Tenis anchos y acojinados</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="artritico" name="ar_calzado" value="pantuflas" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.artritico?.ar_calzado === 'pantuflas'} className={radioCheckboxBaseStyle} /> Calzado de casa / Pantuflas</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="artritico" name="ar_calzado" value="vestir_dificultad" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.artritico?.ar_calzado === 'vestir_dificultad'} className={radioCheckboxBaseStyle} /> Zapato de vestir (con dificultad)</label>
                </div>
            </div>
            <div>
                <p className="font-medium mb-1">¿Utiliza algún dispositivo de ayuda para caminar?</p>
                <div className="flex flex-col gap-1 pl-4">
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="artritico" name="ar_ayuda_caminar" value="no" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.artritico?.ar_ayuda_caminar === 'no'} className={radioCheckboxBaseStyle} /> No</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="artritico" name="ar_ayuda_caminar" value="baston" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.artritico?.ar_ayuda_caminar === 'baston'} className={radioCheckboxBaseStyle} /> Bastón</label>
                    <label className="flex items-center gap-2"><input type="radio" data-perfil="artritico" name="ar_ayuda_caminar" value="andador" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.artritico?.ar_ayuda_caminar === 'andador'} className={radioCheckboxBaseStyle} /> Andador / Caminador</label>
                </div>
            </div>
        </div>
    </div>
  );

  const PerfilNormal: React.FC = () => (
    <div className="space-y-4 p-4 border border-green-300 rounded-lg bg-green-50 mt-4">
      <h3 className="font-semibold text-green-800">Cuestionario: Perfil Normal / Asintomático</h3>
      <div className="space-y-4 text-sm text-gray-700">
        <div>
          <p className="font-medium mb-1">¿Cuál es su principal motivo para realizar este análisis?</p>
          <div className="flex flex-col gap-1 pl-4">
            <label className="flex items-center gap-2"><input type="radio" data-perfil="normal" name="norm_motivo" value="prevencion" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.normal?.norm_motivo === 'prevencion'} className={radioCheckboxBaseStyle} /> Prevención / Bienestar general</label>
            <label className="flex items-center gap-2"><input type="radio" data-perfil="normal" name="norm_motivo" value="comodidad" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.normal?.norm_motivo === 'comodidad'} className={radioCheckboxBaseStyle} /> Mejorar la comodidad al caminar</label>
            <label className="flex items-center gap-2"><input type="radio" data-perfil="normal" name="norm_motivo" value="dolor_ocasional" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.normal?.norm_motivo === 'dolor_ocasional'} className={radioCheckboxBaseStyle} /> Dolor leve u ocasional</label>
            <label className="flex items-center gap-2"><input type="radio" data-perfil="normal" name="norm_motivo" value="curiosidad" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.normal?.norm_motivo === 'curiosidad'} className={radioCheckboxBaseStyle} /> Curiosidad sobre mi tipo de pisada</label>
          </div>
        </div>
        <div>
          <p className="font-medium mb-1">¿Cómo describiría su actividad laboral/diaria principal?</p>
          <div className="flex flex-col gap-1 pl-4">
            <label className="flex items-center gap-2"><input type="radio" data-perfil="normal" name="norm_actividad" value="sedentario" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.normal?.norm_actividad === 'sedentario'} className={radioCheckboxBaseStyle} /> Mayormente sentado (trabajo de oficina)</label>
            <label className="flex items-center gap-2"><input type="radio" data-perfil="normal" name="norm_actividad" value="de_pie" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.normal?.norm_actividad === 'de_pie'} className={radioCheckboxBaseStyle} /> Mayormente de pie (vendedor, mostrador, etc.)</label>
            <label className="flex items-center gap-2"><input type="radio" data-perfil="normal" name="norm_actividad" value="movimiento" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.normal?.norm_actividad === 'movimiento'} className={radioCheckboxBaseStyle} /> Con movimiento constante (almacén, construcción, etc.)</label>
          </div>
        </div>
        <div>
          <p className="font-medium mb-1">¿Qué tipo de calzado utiliza con más frecuencia?</p>
          <div className="flex flex-col gap-1 pl-4">
            <label className="flex items-center gap-2"><input type="checkbox" data-perfil="normal" name="norm_calzado" value="vestir" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.normal?.norm_calzado?.includes('vestir')} className={radioCheckboxBaseStyle} /> Zapato de vestir / Formal</label>
            <label className="flex items-center gap-2"><input type="checkbox" data-perfil="normal" name="norm_calzado" value="casual" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.normal?.norm_calzado?.includes('casual')} className={radioCheckboxBaseStyle} /> Calzado casual / Tenis</label>
            <label className="flex items-center gap-2"><input type="checkbox" data-perfil="normal" name="norm_calzado" value="seguridad" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.normal?.norm_calzado?.includes('seguridad')} className={radioCheckboxBaseStyle} /> Calzado de seguridad / Bota industrial</label>
            <label className="flex items-center gap-2"><input type="checkbox" data-perfil="normal" name="norm_calzado" value="abierto" onChange={handleCuestionarioChange} checked={patientData.cuestionarioRespuestas.normal?.norm_calzado?.includes('abierto')} className={radioCheckboxBaseStyle} /> Sandalias / Calzado abierto</label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Información Personal</h2>
      <form className="space-y-6">
        {/* Fields here */}
        <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre completo *</label>
            <input type="text" name="nombre" id="nombre" value={patientData.nombre} onChange={handleChange} required className={inputBaseStyle}/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
                <label htmlFor="edad" className="block text-sm font-medium text-gray-700">Edad *</label>
                <input type="number" name="edad" id="edad" value={patientData.edad} onChange={handleChange} min="1" max="110" required className={inputBaseStyle}/>
            </div>
             <div>
                <label htmlFor="sexo" className="block text-sm font-medium text-gray-700">Sexo *</label>
                <select name="sexo" id="sexo" value={patientData.sexo} onChange={handleChange} required className={selectBaseStyle}>
                    <option value="">Selecciona...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="X">Prefiero no decir</option>
                </select>
            </div>
             <div>
                <label htmlFor="unidadCalzado" className="block text-sm font-medium text-gray-700">Unidad calzado *</label>
                <select name="unidadCalzado" id="unidadCalzado" value={patientData.unidadCalzado} onChange={handleChange} required className={selectBaseStyle}>
                    <option value="MX">MX</option>
                    <option value="US">US</option>
                    <option value="EU">EU</option>
                    <option value="Mondopoint">Mondopoint</option>
                </select>
            </div>
            <div>
                <label htmlFor="medidaCalzado" className="block text-sm font-medium text-gray-700">Medida calzado *</label>
                <input type="text" name="medidaCalzado" id="medidaCalzado" value={patientData.medidaCalzado} onChange={handleChange} required className={inputBaseStyle} placeholder="Ej: 26.5"/>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label htmlFor="peso" className="block text-sm font-medium text-gray-700">Peso (kg) *</label>
                <input type="number" name="peso" id="peso" value={patientData.peso} onChange={handleChange} min="30" max="200" step="0.1" required className={inputBaseStyle}/>
            </div>
            <div>
                <label htmlFor="talla" className="block text-sm font-medium text-gray-700">Talla (cm) *</label>
                <input type="number" name="talla" id="talla" value={patientData.talla} onChange={handleChange} min="100" max="220" required className={inputBaseStyle}/>
            </div>
            <div>
                <label htmlFor="imc" className="block text-sm font-medium text-gray-700">IMC</label>
                <input type="text" name="imc" id="imc" value={patientData.imc} readOnly className={readOnlyInputStyle}/>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Perfil de Pie *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                    onClick={() => updatePatientData({ tipoProblema: 'diabetico' })}
                    className={`p-4 border-2 rounded-lg cursor-pointer text-center transition-all duration-200 flex flex-col justify-center items-center h-full ${
                    patientData.tipoProblema === 'diabetico'
                        ? 'border-yellow-500 bg-yellow-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-yellow-400 hover:bg-yellow-50'
                    }`}
                >
                    <svg className="w-10 h-10 mx-auto text-yellow-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                    <p className="font-semibold text-sm text-gray-800">Pie Diabético</p>
                </div>
                
                <div
                    onClick={() => updatePatientData({ tipoProblema: 'artritico' })}
                    className={`p-4 border-2 rounded-lg cursor-pointer text-center transition-all duration-200 flex flex-col justify-center items-center h-full ${
                    patientData.tipoProblema === 'artritico'
                        ? 'border-red-500 bg-red-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-red-400 hover:bg-red-50'
                    }`}
                >
                    <svg className="w-10 h-10 mx-auto text-red-600 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.5 10.5c-1.1 1.1 0 2.5 2 2.5s3.5-2.5 3.5-5-2.5-3.5-5-3.5-2.5 1.4-1.5 2.5" />
                        <path d="M19.5 13.5c1.1-1.1 0-2.5-2-2.5s-3.5 2.5-3.5 5 2.5 3.5 5 3.5 2.5-1.4 1.5-2.5" />
                        <path d="M8.5 15.5l7-7" />
                    </svg>
                    <p className="font-semibold text-sm text-gray-800">Pie Artrítico</p>
                </div>

                <div
                    onClick={() => updatePatientData({ tipoProblema: 'deportista' })}
                    className={`p-4 border-2 rounded-lg cursor-pointer text-center transition-all duration-200 flex flex-col justify-center items-center h-full ${
                    patientData.tipoProblema === 'deportista'
                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                >
                    <svg className="w-10 h-10 mx-auto text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    <p className="font-semibold text-sm text-gray-800">Deportista</p>
                </div>

                <div
                    onClick={() => updatePatientData({ tipoProblema: 'normal' })}
                    className={`p-4 border-2 rounded-lg cursor-pointer text-center transition-all duration-200 flex flex-col justify-center items-center h-full ${
                    patientData.tipoProblema === 'normal'
                        ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
                    }`}
                >
                    <svg className="w-10 h-10 mx-auto text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <p className="font-semibold text-sm text-gray-800">Normal / Asintomático</p>
                </div>
            </div>
        </div>


        {patientData.tipoProblema === 'diabetico' && <PerfilDiabetico />}
        {patientData.tipoProblema === 'deportista' && <PerfilDeportista />}
        {patientData.tipoProblema === 'artritico' && <PerfilArtritico />}
        {patientData.tipoProblema === 'normal' && <PerfilNormal />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo electrónico *</label>
                <input type="email" name="email" id="email" value={patientData.email} onChange={handleChange} required className={inputBaseStyle}/>
            </div>
            <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">WhatsApp</label>
                <input type="tel" name="whatsapp" id="whatsapp" value={patientData.whatsapp} onChange={handleChange} placeholder="+52 55 1234 5678" className={inputBaseStyle}/>
            </div>
        </div>
      </form>
      <div className="flex justify-between mt-8">
        <button type="button" onClick={onBack} className="px-6 py-3 font-semibold text-white bg-gray-500 rounded-lg shadow-md hover:bg-gray-600 transition-colors">Atrás</button>
        <button type="button" onClick={onNext} disabled={!isFormValid()} className="px-6 py-3 font-semibold text-white bg-primary-800 rounded-lg shadow-md hover:bg-primary-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">Siguiente</button>
      </div>
    </div>
  );
};

export default Step2PersonalInfo;