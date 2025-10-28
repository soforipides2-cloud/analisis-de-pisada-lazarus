import React, { useState } from 'react';

interface Step1ConsentProps {
  onNext: () => void;
}

const Step1Consent: React.FC<Step1ConsentProps> = ({ onNext }) => {
  const [consentChecked, setConsentChecked] = useState(false);

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Aviso de Privacidad y Consentimiento</h2>
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-1 h-5 w-5 text-primary-800 rounded focus:ring-primary-700 border-gray-300"
          />
          <span className="text-gray-700">
            He leído y acepto el <a href="#" target="_blank" rel="noopener noreferrer" className="text-primary-800 font-medium hover:underline">Aviso de Privacidad</a> y doy mi consentimiento para el procesamiento de mis datos personales y biométricos con fines de análisis orientativo de pisada.
          </span>
        </label>
        <p className="mt-4 text-sm text-gray-600">
            ¿No sabes cómo tomar las fotos? Consulta nuestra 
            <a href="/instructions.html" target="_blank" rel="noopener noreferrer" className="text-primary-800 font-medium hover:underline">
                guía paso a paso para obtener las mejores imágenes
            </a>.
        </p>
      </div>
      <p className="text-sm text-gray-600 my-6">Tu privacidad es importante. Todas las imágenes se procesan en tu navegador y solo se envían los resultados procesados.</p>
      <div className="flex justify-end mt-8">
        <button
          type="button"
          className="px-6 py-3 font-semibold text-white bg-primary-800 rounded-lg shadow-md hover:bg-primary-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          onClick={onNext}
          disabled={!consentChecked}
        >
          Comenzar Análisis
        </button>
      </div>
    </div>
  );
};

export default Step1Consent;
