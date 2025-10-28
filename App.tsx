import React, { useState, useCallback } from 'react';
import type { PatientData, FootData, Step, FootSide } from './types.ts';
import { initialPatientData, initialFootData, STEPS } from './constants.ts';
import Step1Consent from './components/steps/Step1Consent.tsx';
import Step2PersonalInfo from './components/steps/Step2PersonalInfo.tsx';
import Step3FootCapture from './components/steps/Step3FootCapture.tsx';
import Step4ShoeWear from './components/steps/Step4ShoeWear.tsx';
import Step5Results from './components/steps/Step5Results.tsx';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [patientData, setPatientData] = useState<PatientData>(initialPatientData);
  const [footData, setFootData] = useState<FootData>(initialFootData);

  const updatePatientData = useCallback((data: Partial<PatientData>) => {
    setPatientData(prev => ({ ...prev, ...data }));
  }, []);

  const updateFootData = useCallback((side: FootSide, data: Partial<FootData[FootSide]>) => {
    setFootData(prev => ({
      ...prev,
      [side]: { ...prev[side], ...data }
    }));
  }, []);

  const goToStep = (step: number) => {
    if (step >= 1 && step <= STEPS.length) {
      setCurrentStep(step);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Consent onNext={() => goToStep(2)} />;
      case 2:
        return <Step2PersonalInfo
          patientData={patientData}
          updatePatientData={updatePatientData}
          onNext={() => goToStep(3)}
          onBack={() => goToStep(1)}
        />;
      case 3:
        return <Step3FootCapture
          key="right-capture"
          side="right"
          footData={footData.right}
          updateFootData={(data) => updateFootData('right', data)}
          onNext={() => goToStep(4)}
          onBack={() => goToStep(2)}
        />;
      case 4:
        return <Step3FootCapture
          key="left-capture"
          side="left"
          footData={footData.left}
          updateFootData={(data) => updateFootData('left', data)}
          onNext={() => goToStep(5)}
          onBack={() => goToStep(3)}
        />;
      case 5:
        return <Step4ShoeWear
            footData={footData}
            updateFootData={updateFootData}
            onNext={() => goToStep(6)}
            onBack={() => goToStep(4)}
        />;
      case 6:
        return <Step5Results
          patientData={patientData}
          footData={footData}
          onBack={() => goToStep(5)}
        />;
      default:
        return <Step1Consent onNext={() => goToStep(2)} />;
    }
  };

  const progressPercentage = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-sans">
      <header className="text-center mb-10">
        <img src="/images/logo.png" alt="Logo del Negocio" className="mx-auto h-16 mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Análisis Orientativo de Pisada</h1>
        <p className="text-gray-600 mt-2">Tecnología avanzada y atención humana para tu movilidad</p>
      </header>
      <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 md:p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold text-primary-800">{STEPS[currentStep - 1].name}</p>
              <p className="text-sm font-medium text-gray-600">Paso {currentStep} de {STEPS.length}</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-800 h-2 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default App;