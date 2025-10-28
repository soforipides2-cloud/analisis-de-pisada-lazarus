import React, { useState } from 'react';
import type { FootData, FootSide } from '../../types';

interface Step4ShoeWearProps {
  footData: FootData;
  updateFootData: (side: FootSide, data: Partial<FootData[FootSide]>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ImageUploader: React.FC<{
  side: FootSide;
  imageData: string | null;
  onImageUpload: (side: FootSide, data: string) => void;
}> = ({ side, imageData, onImageUpload }) => {
  const [error, setError] = useState<string | null>(null);
  const sideCapitalized = side === 'right' ? 'Derecho' : 'Izquierdo';
  const inputId = `shoeFile-${side}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) { // 8MB limit
        setError('La imagen debe ser menor a 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageUpload(side, event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="text-center">
      <h3 className="font-semibold mb-3 text-gray-800">Zapato {sideCapitalized}</h3>
      {imageData ? (
        <div className="relative group">
          <img src={imageData} alt={`Suela zapato ${sideCapitalized}`} className="w-full rounded-lg border-2 border-green-500" />
          <button
            onClick={() => onImageUpload(side, '')}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Eliminar imagen zapato ${sideCapitalized}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="image-upload" onClick={() => document.getElementById(inputId)?.click()}>
          <p className="text-gray-700">👟 Capturar suela del zapato {sideCapitalized}</p>
          <input type="file" id={inputId} accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        </div>
      )}
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
};

const Step4ShoeWear: React.FC<Step4ShoeWearProps> = ({ footData, updateFootData, onNext, onBack }) => {

  const handleImageUpload = (side: FootSide, dataUrl: string) => {
    updateFootData(side, { shoeWear: dataUrl || null });
  };

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Análisis de Desgaste del Calzado</h2>
      <p className="text-gray-600 mb-6">
        Este paso es opcional pero <strong>altamente recomendado</strong>. Una foto de las suelas de tus zapatos más usados nos da información valiosa sobre cómo caminas.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ImageUploader
          side="right"
          imageData={footData.right.shoeWear}
          onImageUpload={handleImageUpload}
        />
        <ImageUploader
          side="left"
          imageData={footData.left.shoeWear}
          onImageUpload={handleImageUpload}
        />
      </div>

      <div className="flex justify-between mt-8">
        <button type="button" onClick={onBack} className="px-6 py-3 font-semibold text-white bg-gray-500 rounded-lg shadow-md hover:bg-gray-600 transition-colors">Atrás</button>
        <button type="button" onClick={onNext} className="px-6 py-3 font-semibold text-white bg-primary-800 rounded-lg shadow-md hover:bg-primary-900 transition-colors">Generar Resultados</button>
      </div>
    </div>
  );
};

export default Step4ShoeWear;