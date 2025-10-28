import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { FootSide, FootDataSide, SelectionRect, Point } from '../../types.ts';
import { processImageToHeatmap } from '../../utils/imageProcessing.ts';

interface Step3FootCaptureProps {
  side: FootSide;
  footData: FootDataSide;
  updateFootData: (data: Partial<FootDataSide>) => void;
  onNext: () => void;
  onBack: () => void;
}

const Step3FootCapture: React.FC<Step3FootCaptureProps> = ({ side, footData, updateFootData, onNext, onBack }) => {
  const [currentSubStep, setCurrentSubStep] = useState<'plantar' | 'medial' | 'medial-points' | 'posterior' | 'posterior-lines'>('plantar');
  const [error, setError] = useState<string | null>(null);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<SelectionRect | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const selectionImageRef = useRef<HTMLImageElement>(null);

  const [medialPoints, setMedialPoints] = useState<Point[]>([]);
  const medialImageRef = useRef<HTMLImageElement>(null);
  const medialPointInstructions = [
    "1. Haz clic en el punto más bajo del talón.",
    "2. Haz clic en la base del dedo gordo (articulación).",
    "3. Haz clic en el hueso del empeine que más sobresale (Navicular)."
  ];
  
  const [posteriorLines, setPosteriorLines] = useState<{ calf: Point[], heel: Point[] }>({ calf: [], heel: [] });
  const posteriorImageRef = useRef<HTMLImageElement>(null);
  const posteriorLineInstructions = [
    "1. Dibuja la línea de la pantorrilla (2 clics).",
    "2. Haz clic en el punto superior de la línea.",
    "3. Ahora dibuja la línea del talón (2 clics).",
    "4. Haz clic en el punto superior de la línea.",
    "Líneas completas. ¡Confirma para continuar!"
  ];

  const sideCapitalized = side.charAt(0).toUpperCase() + side.slice(1);
  const isRight = side === 'right';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, view: 'plantar' | 'medial' | 'posterior') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setError('La imagen debe ser menor a 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        updateFootData({ [view]: result });
        if (view === 'plantar') setSelection(null);
        if (view === 'medial') setCurrentSubStep('medial-points');
        if (view === 'posterior') setCurrentSubStep('posterior-lines');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSelectionStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!selectionImageRef.current) return;
    e.preventDefault();
    const rect = selectionImageRef.current.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    
    if (x < 0 || y < 0 || x > rect.width || y < 0) return;

    setStartPoint({ x, y });
    setSelection({ x, y, width: 0, height: 0 });
    setIsSelecting(true);
  }, []);
  
  const handleSelectionMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isSelecting || !startPoint || !selectionImageRef.current) return;
    e.preventDefault();
    const rect = selectionImageRef.current.getBoundingClientRect();
    
    let currentX = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    let currentY = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    currentX = Math.max(0, Math.min(currentX, rect.width));
    currentY = Math.max(0, Math.min(currentY, rect.height));

    const newSelection: SelectionRect = {
        x: Math.min(startPoint.x, currentX),
        y: Math.min(startPoint.y, currentY),
        width: Math.abs(currentX - startPoint.x),
        height: Math.abs(currentY - startPoint.y),
    };
    setSelection(newSelection);
  }, [isSelecting, startPoint]);

  const handleSelectionEnd = useCallback(() => {
    setIsSelecting(false);
    setStartPoint(null);
    setSelection(currentSelection => {
       if (currentSelection && (currentSelection.width < 50 || currentSelection.height < 50)) {
        setError('La selección es muy pequeña. Intenta de nuevo.');
        return null;
      } else {
        setError(null);
        return currentSelection;
      }
    });
  }, []);
  
  useEffect(() => {
    if (!isSelecting) return;
    window.addEventListener('mousemove', handleSelectionMove);
    window.addEventListener('touchmove', handleSelectionMove);
    window.addEventListener('mouseup', handleSelectionEnd);
    window.addEventListener('touchend', handleSelectionEnd);

    return () => {
      window.removeEventListener('mousemove', handleSelectionMove);
      window.removeEventListener('touchmove', handleSelectionMove);
      window.removeEventListener('mouseup', handleSelectionEnd);
      window.removeEventListener('touchend', handleSelectionEnd);
    };
  }, [isSelecting, handleSelectionMove, handleSelectionEnd]);


  const handleProcessSelection = async () => {
    if (!selection || !footData.footMeasurement || !footData.plantar || !selectionImageRef.current) {
        setError("Completa la selección y la medida del pie.");
        return;
    }

    updateFootData({ selectionRect: selection });

    try {
        const { cropped, grayscale, heatmap } = await processImageToHeatmap(
            footData.plantar, 
            selection, 
            { width: selectionImageRef.current.offsetWidth, height: selectionImageRef.current.offsetHeight },
            selectionImageRef.current.naturalWidth,
            selectionImageRef.current.naturalHeight
        );
        updateFootData({
            step1Image: cropped,
            step2Canvas: grayscale,
            step3Canvas: heatmap,
        });
    } catch (e) {
        console.error(e);
        setError("Error al procesar la imagen.");
    }
  };
  
  const confirmHeatmap = () => {
    updateFootData({ plantarConfirmed: true });
    setCurrentSubStep('medial');
  };
  
  const handleMedialClick = (e: React.MouseEvent) => {
    if (medialPoints.length >= 3 || !medialImageRef.current) return;
    const rect = medialImageRef.current.getBoundingClientRect();
    const scaleX = medialImageRef.current.naturalWidth / rect.width;
    const scaleY = medialImageRef.current.naturalHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setMedialPoints(prev => [...prev, { x, y }]);
  };
  
  const confirmMedialPoints = () => {
    if (medialPoints.length === 3) {
      updateFootData({
        medialTrianglePoints: {
          p1: medialPoints[0],
          p2: medialPoints[1],
          p3: medialPoints[2],
        },
      });
      setCurrentSubStep('posterior');
    }
  };
  
  const handlePosteriorClick = (e: React.MouseEvent) => {
    if ((posteriorLines.calf.length >= 2 && posteriorLines.heel.length >= 2) || !posteriorImageRef.current) return;

    const rect = posteriorImageRef.current.getBoundingClientRect();
    const scaleX = posteriorImageRef.current.naturalWidth / rect.width;
    const scaleY = posteriorImageRef.current.naturalHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const newPoint = { x, y };

    if (posteriorLines.calf.length < 2) {
      setPosteriorLines(prev => ({ ...prev, calf: [...prev.calf, newPoint] }));
    } else if (posteriorLines.heel.length < 2) {
      setPosteriorLines(prev => ({ ...prev, heel: [...prev.heel, newPoint] }));
    }
  };
  
  const confirmPosteriorLines = () => {
    if (posteriorLines.calf.length === 2 && posteriorLines.heel.length === 2) {
      updateFootData({
        posteriorLinePoints: {
            calf: [posteriorLines.calf[0], posteriorLines.calf[1]],
            heel: [posteriorLines.heel[0], posteriorLines.heel[1]],
        }
      });
    }
  };


  const isNextEnabled = footData.plantarConfirmed && footData.medialTrianglePoints && footData.posteriorLinePoints;

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Captura de Pie {isRight ? 'Derecho' : 'Izquierdo'}</h2>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

      {/* Plantar View */}
      <div className={`${currentSubStep !== 'plantar' ? 'opacity-50' : ''}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Vista Plantar</h3>
        
        {!footData.plantar && (
           <div className="image-upload" onClick={() => document.getElementById(`plantarFile-${side}`)?.click()}>
                <p className="text-gray-700">📸 Capturar vista plantar del pie {isRight ? 'derecho' : 'izquierdo'}</p>
                <input type="file" id={`plantarFile-${side}`} accept="image/*" capture="environment" className="hidden" onChange={e => handleFileChange(e, 'plantar')} />
           </div>
        )}
        
        {footData.plantar && !footData.plantarConfirmed && (
            <div>
                 <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 mb-6 rounded-r-lg" role="alert">
                  <div className="flex">
                    <div className="py-1">
                      <svg className="fill-current h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 11v4h2v-4H9zm0-4v2h2V7H9z"/></svg>
                    </div>
                    <div>
                      <p className="font-bold">¡Atención! Este paso es muy importante.</p>
                      <p className="text-sm">Asegúrate de <strong>seleccionar toda la huella del pie</strong> en el recuadro y de <strong>ingresar su longitud exacta en centímetros</strong>. Esta información es crucial para calcular el área de contacto y analizar cómo distribuyes tu peso entre ambos pies.</p>
                    </div>
                  </div>
                </div>

                <div 
                    className="relative inline-block cursor-crosshair border-2 border-gray-200 rounded-lg overflow-hidden select-none"
                    onMouseDown={handleSelectionStart}
                    onTouchStart={handleSelectionStart}
                >
                    <img 
                      ref={selectionImageRef} 
                      src={footData.plantar} 
                      alt="Vista plantar" 
                      className="max-w-full block"
                      style={{ touchAction: 'none' }}
                      draggable="false"
                    />
                    {selection && (
                        <div 
                            className={`absolute border-2 ${selection.width > 50 && selection.height > 50 ? 'border-green-500 bg-green-500/20' : 'border-primary-800 bg-primary-800/20'}`}
                            style={{ left: selection.x, top: selection.y, width: selection.width, height: selection.height, pointerEvents: 'none' }}
                        ></div>
                    )}
                </div>

                <div className="mt-4 text-center">
                    <label htmlFor={`footMeasurement-${side}`} className="block text-sm font-medium text-gray-900 mb-2">Medida del pie (cm) *</label>
                    <input type="number" id={`footMeasurement-${side}`} value={footData.footMeasurement || ''} onChange={e => updateFootData({footMeasurement: parseFloat(e.target.value)})} min="20" max="35" step="0.1" placeholder="Ej: 26.5" className="max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"/>
                </div>

                <div className="flex justify-center gap-4 mt-6">
                    <button type="button" className="px-6 py-3 font-semibold text-white bg-yellow-500 rounded-lg shadow-md hover:bg-yellow-600" onClick={() => updateFootData({ plantar: null, selectionRect: null, step1Image: null, step2Canvas: null, step3Canvas: null })}>Reintentar</button>

                    <button type="button" className="px-6 py-3 font-semibold text-white bg-primary-800 rounded-lg shadow-md hover:bg-primary-900" onClick={handleProcessSelection} disabled={!selection || !footData.footMeasurement}>Generar Mapa</button>
                </div>
            </div>
        )}

        {footData.step3Canvas && !footData.plantarConfirmed && (
            <div className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-center">
                    <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">1. Selección</p>
                        <img src={footData.step1Image!} className="w-full rounded-lg border" alt="Selección"/>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">2. Grises</p>
                        <img src={footData.step2Canvas!} className="w-full rounded-lg border" alt="Grises"/>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">3. Mapa de calor</p>
                        <img src={footData.step3Canvas!} className="w-full rounded-lg border" alt="Mapa de calor"/>
                    </div>
                </div>
                 <div className="flex justify-center gap-4 mt-6">
                    <button type="button" className="px-6 py-3 font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700" onClick={confirmHeatmap}>Confirmar Mapa</button>
                </div>
            </div>
        )}

        {footData.plantarConfirmed && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center font-semibold">
                ✅ Vista Plantar Confirmada
            </div>
        )}
      </div>

      {/* Medial View */}
      {footData.plantarConfirmed && (
         <div className={`mt-8 ${!['medial', 'medial-points'].includes(currentSubStep) ? 'opacity-50' : ''}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Vista Medial</h3>
             {!footData.medial ? (
                <div className="image-upload" onClick={() => document.getElementById(`medialFile-${side}`)?.click()}>
                    <p className="text-gray-700">📸 Capturar vista medial</p>
                    <input type="file" id={`medialFile-${side}`} accept="image/*" capture="environment" className="hidden" onChange={e => handleFileChange(e, 'medial')} />
                </div>
             ) : currentSubStep === 'medial-points' && !footData.medialTrianglePoints ? (
                <div>
                  <p className="text-center font-medium text-gray-800 mb-2">{medialPointInstructions[medialPoints.length] || "Puntos seleccionados. ¡Confirma para continuar!"}</p>
                  <div className="relative inline-block cursor-crosshair" onClick={handleMedialClick}>
                    <img ref={medialImageRef} src={footData.medial} alt="Vista medial para seleccionar puntos" className="max-w-full block rounded-lg"/>
                    <svg className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                      {medialPoints.map((p, i) => {
                          if (!medialImageRef.current) return null;
                          const rect = medialImageRef.current.getBoundingClientRect();
                          const scaleX = rect.width / medialImageRef.current.naturalWidth;
                          const scaleY = rect.height / medialImageRef.current.naturalHeight;
                          return <circle key={i} cx={p.x * scaleX} cy={p.y * scaleY} r="5" fill="rgba(239, 68, 68, 0.8)" stroke="white" strokeWidth="2" />;
                      })}
                      {medialPoints.length === 3 && medialImageRef.current && (
                          <polygon 
                              points={medialPoints.map(p => {
                                  const rect = medialImageRef.current!.getBoundingClientRect();
                                  const scaleX = rect.width / medialImageRef.current!.naturalWidth;
                                  const scaleY = rect.height / medialImageRef.current!.naturalHeight;
                                  return `${p.x * scaleX},${p.y * scaleY}`;
                              }).join(' ')}
                              fill="rgba(239, 68, 68, 0.2)"
                              stroke="rgba(239, 68, 68, 0.8)"
                              strokeWidth="2"
                          />
                      )}
                    </svg>
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                      <button type="button" onClick={() => setMedialPoints([])} className="px-4 py-2 text-sm font-semibold bg-gray-200 rounded-md">Reiniciar Puntos</button>
                      <button type="button" onClick={confirmMedialPoints} disabled={medialPoints.length !== 3} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md disabled:bg-gray-400">Confirmar Triángulo</button>
                  </div>
                </div>
             ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center font-semibold">
                    ✅ Vista Medial Confirmada
                </div>
             )}
         </div>
      )}

      {/* Posterior View */}
      {footData.plantarConfirmed && footData.medialTrianglePoints && (
         <div className={`mt-8 ${!['posterior', 'posterior-lines'].includes(currentSubStep) ? 'opacity-50' : ''}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Vista Posterior</h3>
             {!footData.posterior ? (
                <div className="image-upload" onClick={() => document.getElementById(`posteriorFile-${side}`)?.click()}>
                    <p className="text-gray-700">📸 Capturar vista posterior</p>
                    <input type="file" id={`posteriorFile-${side}`} accept="image/*" capture="environment" className="hidden" onChange={e => handleFileChange(e, 'posterior')} />
                </div>
             ) : currentSubStep === 'posterior-lines' && !footData.posteriorLinePoints ? (
                <div>
                   <p className="text-center font-medium text-gray-800 mb-2">{posteriorLineInstructions[posteriorLines.calf.length + posteriorLines.heel.length]}</p>
                   <div className="relative inline-block cursor-crosshair" onClick={handlePosteriorClick}>
                      <img ref={posteriorImageRef} src={footData.posterior} alt="Vista posterior para seleccionar líneas" className="max-w-full block rounded-lg"/>
                      <svg className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                         {posteriorLines.calf.concat(posteriorLines.heel).map((p, i) => {
                             if (!posteriorImageRef.current) return null;
                             const rect = posteriorImageRef.current.getBoundingClientRect();
                             const scaleX = rect.width / posteriorImageRef.current.naturalWidth;
                             const scaleY = rect.height / posteriorImageRef.current.naturalHeight;
                             return <circle key={i} cx={p.x * scaleX} cy={p.y * scaleY} r="5" fill="rgba(59, 130, 246, 0.8)" stroke="white" strokeWidth="2" />;
                         })}
                         {posteriorLines.calf.length === 2 && posteriorImageRef.current && (
                             <line
                                 x1={posteriorLines.calf[0].x * (posteriorImageRef.current.getBoundingClientRect().width / posteriorImageRef.current.naturalWidth)}
                                 y1={posteriorLines.calf[0].y * (posteriorImageRef.current.getBoundingClientRect().height / posteriorImageRef.current.naturalHeight)}
                                 x2={posteriorLines.calf[1].x * (posteriorImageRef.current.getBoundingClientRect().width / posteriorImageRef.current.naturalWidth)}
                                 y2={posteriorLines.calf[1].y * (posteriorImageRef.current.getBoundingClientRect().height / posteriorImageRef.current.naturalHeight)}
                                 stroke="rgba(59, 130, 246, 0.8)" strokeWidth="3"
                             />
                         )}
                         {posteriorLines.heel.length === 2 && posteriorImageRef.current && (
                             <line
                                 x1={posteriorLines.heel[0].x * (posteriorImageRef.current.getBoundingClientRect().width / posteriorImageRef.current.naturalWidth)}
                                 y1={posteriorLines.heel[0].y * (posteriorImageRef.current.getBoundingClientRect().height / posteriorImageRef.current.naturalHeight)}
                                 x2={posteriorLines.heel[1].x * (posteriorImageRef.current.getBoundingClientRect().width / posteriorImageRef.current.naturalWidth)}
                                 y2={posteriorLines.heel[1].y * (posteriorImageRef.current.getBoundingClientRect().height / posteriorImageRef.current.naturalHeight)}
                                 stroke="rgba(239, 68, 68, 0.8)" strokeWidth="3"
                             />
                         )}
                      </svg>
                   </div>
                   <div className="flex justify-center gap-4 mt-4">
                       <button type="button" onClick={() => setPosteriorLines({ calf: [], heel: [] })} className="px-4 py-2 text-sm font-semibold bg-gray-200 rounded-md">Reiniciar Líneas</button>
                       <button type="button" onClick={confirmPosteriorLines} disabled={posteriorLines.calf.length !== 2 || posteriorLines.heel.length !== 2} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md disabled:bg-gray-400">Confirmar Alineación</button>
                   </div>
                </div>
             ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center font-semibold">
                    ✅ Vista Posterior Confirmada
                </div>
             )}
         </div>
      )}
      
      <div className="flex justify-between mt-8">
        <button type="button" onClick={onBack} className="px-6 py-3 font-semibold text-white bg-gray-500 rounded-lg shadow-md hover:bg-gray-600 transition-colors">Atrás</button>
        <button type="button" onClick={onNext} disabled={!isNextEnabled} className="px-6 py-3 font-semibold text-white bg-primary-800 rounded-lg shadow-md hover:bg-primary-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">Siguiente</button>
      </div>
    </div>
  );
};

export default Step3FootCapture;