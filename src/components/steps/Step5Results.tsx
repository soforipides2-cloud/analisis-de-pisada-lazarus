import React, { useState, useEffect, useRef } from 'react';
import type { PatientData, FootData, FootMetrics, ReportData, FootDataSide, Point } from '../../types';
import { generateExecutiveSummary } from '../../services/geminiService';
import { calculateAllMetrics } from '../../utils/imageProcessing';

declare global {
    interface Window { jspdf: any; }
    var html2canvas: any;
}

const LoadingIndicator: React.FC<{ text: string }> = ({ text }) => (
    <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800 mx-auto"></div>
        <p className="mt-4 text-gray-600">{text}</p>
    </div>
);

const AnalysisImageView: React.FC<{
  src: string;
  points?: { p1: Point; p2: Point; p3: Point };
  lines?: { calf: [Point, Point]; heel: [Point, Point] };
}> = ({ src, points, lines }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = imgRef.current;
    const updateSize = () => {
      if (img) setImgSize({ width: img.offsetWidth, height: img.offsetHeight });
    };

    if (img?.complete) {
      updateSize();
    } else {
      img?.addEventListener('load', updateSize);
    }
    window.addEventListener('resize', updateSize);
    return () => {
      img?.removeEventListener('load', updateSize);
      window.removeEventListener('resize', updateSize);
    };
  }, [src]);

  const getScale = () => {
    if (!imgRef.current || !imgSize.width) return { scaleX: 1, scaleY: 1 };
    return {
      scaleX: imgSize.width / imgRef.current.naturalWidth,
      scaleY: imgSize.height / imgRef.current.naturalHeight,
    };
  };

  const { scaleX, scaleY } = getScale();

  return (
    <div className="relative">
      <img ref={imgRef} src={src} className="w-full rounded-lg border bg-gray-100" alt="Analysis view" />
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {points && (
          <polygon
            points={Object.values(points).map(p => `${p.x * scaleX},${p.y * scaleY}`).join(' ')}
            fill="rgba(239, 68, 68, 0.2)"
            stroke="#ef4444"
            strokeWidth="2"
          />
        )}
        {lines && (
          <>
            <line
              x1={lines.calf[0].x * scaleX} y1={lines.calf[0].y * scaleY}
              x2={lines.calf[1].x * scaleX} y2={lines.calf[1].y * scaleY}
              stroke="#3b82f6" strokeWidth="3"
            />
            <line
              x1={lines.heel[0].x * scaleX} y1={lines.heel[0].y * scaleY}
              x2={lines.heel[1].x * scaleX} y2={lines.heel[1].y * scaleY}
              stroke="#ef4444" strokeWidth="3"
            />
          </>
        )}
      </svg>
    </div>
  );
};


const Step5Results: React.FC<{ patientData: PatientData; footData: FootData; onBack: () => void; }> = ({ patientData, footData, onBack }) => {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<ReportData | null>(null);
    const [metrics, setMetrics] = useState<{ right: FootMetrics, left: FootMetrics } | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const analyzeData = async () => {
            setLoading(true);
            try {
                const calculatedMetrics = {
                    right: await calculateAllMetrics(footData.right, 'right'),
                    left: await calculateAllMetrics(footData.left, 'left')
                };
                setMetrics(calculatedMetrics);

                const aiReport = await generateExecutiveSummary(patientData, calculatedMetrics.right, calculatedMetrics.left, footData);
                setReport(aiReport);
            } catch (error) {
                console.error("Error generating report:", error);
                setReport({ 
                    summary: { general: "Error.", pieDerecho: "Error.", pieIzquierdo: "Error.", balance: "Error." }, 
                    recommendations: { cnc: "N/A", shoes: [], exercises: [] } 
                });
            } finally {
                setLoading(false);
            }
        };
        analyzeData();
    }, [patientData, footData]);
    
    const getAlertColor = (value: number | null, thresholds: [number, number, number, number]): 'green' | 'yellow' | 'red' => {
        if (value === null) return 'yellow';
        const [r1, y1, y2, r2] = thresholds;
        if (value >= y1 && value <= y2) return 'green';
        if ((value > y2 && value <= r2) || (value < y1 && value >= r1)) return 'yellow';
        return 'red';
    };

    const getSymmetryColor = (val1: number | null, val2: number | null, thresholds: [number, number], isAngle: boolean = false): 'green' | 'yellow' | 'red' => {
        if(val1 === null || val2 === null) return 'yellow';
        const diff = Math.abs(val1 - val2);
        if (diff <= thresholds[0]) return 'green';
        if (diff <= thresholds[1]) return 'yellow';
        return 'red';
    };

    const getTotalLoadSymmetryColor = (load1: number, load2: number): 'green' | 'yellow' | 'red' => {
        if (load1 === 0 || load2 === 0) return 'red';
        const symmetry = (Math.min(load1, load2) / Math.max(load1, load2)) * 100;
        if (symmetry >= 90) return 'green';
        if (symmetry >= 80) return 'yellow';
        return 'red';
    };

    const folio = `LZ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const reportDate = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

    const downloadPdf = async () => {
        const { jsPDF } = window.jspdf;
        const reportElement = reportRef.current;
        if (reportElement) {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const elements = reportElement.querySelectorAll('.pdf-page');

            for (let i = 0; i < elements.length; i++) {
                const element = elements[i] as HTMLElement;
                const canvas = await html2canvas(element, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL('image/jpeg', 0.98);

                const imgProps = pdf.getImageProperties(imgData);
                const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
                
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
            }

            pdf.save(`Reporte_Pisada_${patientData.nombre.replace(/\s/g, '_')}.pdf`);
        }
    };
    
    const handleWhatsAppShare = () => {
        downloadPdf().then(() => {
            const message = `Hola ${patientData.nombre},\n\nTe comparto el reporte de tu análisis de pisada realizado el día ${reportDate}.\n\nFolio: ${folio}\n\n*Adjunto el reporte en PDF para su revisión.*\n\nPor favor, no dudes en contactarnos si tienes alguna pregunta.\n\nSaludos cordiales,\nProyecto Lazarus`;
            
            const whatsappUrl = `https://wa.me/525558188679?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        });
    };

    if (loading || !metrics || !report) return <LoadingIndicator text="Generando reporte clínico biomecánico..." />;

    const MetricTile: React.FC<{ label: string; value: string; color: string; }> = ({ label, value, color }) => (
        <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="flex items-center">
                <div className={`traffic-light-indicator traffic-light-${color}`}></div>
                <span className="text-sm font-medium text-gray-600">{label}</span>
            </div>
            <p className="text-right text-lg font-bold text-gray-900">{value}</p>
        </div>
    );
    
    const DetailedFootAnalysis: React.FC<{ side: 'Derecho' | 'Izquierdo', metrics: FootMetrics, footDataSide: FootDataSide }> = ({ side, metrics, footDataSide }) => (
        <div className="pdf-page">
            <section className="p-6">
                <h2 className="text-xl font-bold text-primary-800 mb-6">👣 Análisis Detallado - Pie {side}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-center text-gray-700">Vista Plantar</h3>
                        <img src={footDataSide.step3Canvas!} className="w-full rounded-lg border" alt={`Heatmap ${side}`}/>
                        <h3 className="font-semibold text-center text-gray-700 mt-4">Distribución de Carga</h3>
                        <MetricTile label="Carga Retropié" value={`${metrics.retropie.toFixed(1)}%`} color={getAlertColor(metrics.retropie, [15, 25, 40, 50])} />
                        <MetricTile label="Carga Mediopié" value={`${metrics.mediopie.toFixed(1)}%`} color={getAlertColor(metrics.mediopie, [5, 15, 35, 45])} />
                        <MetricTile label="Carga Antepié" value={`${metrics.antepie.toFixed(1)}%`} color={getAlertColor(metrics.antepie, [20, 30, 45, 55])} />
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold text-center text-gray-700">Vista Medial (Arco)</h3>
                        <AnalysisImageView src={footDataSide.medial!} points={footDataSide.medialTrianglePoints!} />
                         <MetricTile label="Ángulo Navicular" value={`${metrics.navicularAngle?.toFixed(1) ?? 'N/A'}°`} color={getAlertColor(metrics.navicularAngle, [125, 135, 155, 165])} />
                         <div className="bg-gray-50 rounded-lg p-3 border text-center">
                             <p className="text-sm font-medium text-gray-600">Diagnóstico de Arco</p>
                             <p className="text-lg font-bold text-primary-800 capitalize">{metrics.archType}</p>
                         </div>
                    </div>
                     <div className="space-y-4">
                        <h3 className="font-semibold text-center text-gray-700">Vista Posterior (Talón)</h3>
                        <AnalysisImageView src={footDataSide.posterior!} lines={footDataSide.posteriorLinePoints!} />
                        <MetricTile label="Ángulo del Talón" value={`${metrics.rearfootAngle?.toFixed(1) ?? 'N/A'}°`} color={getAlertColor(metrics.rearfootAngle, [-10, -8, 8, 10])} />
                         <div className="bg-gray-50 rounded-lg p-3 border text-center">
                             <p className="text-sm font-medium text-gray-600">Alineación</p>
                             <p className="text-lg font-bold text-primary-800">
                                {metrics.rearfootAngle !== null ? (metrics.rearfootAngle > 4 ? 'Valgo' : metrics.rearfootAngle < -4 ? 'Varo' : 'Neutro') : 'No medido'}
                             </p>
                         </div>
                    </div>
                </div>
            </section>
        </div>
    );

    return (
        <div>
            <div ref={reportRef} className="bg-white rounded-lg overflow-hidden border border-gray-200">
                <div className="pdf-page">
                    <header className="p-6 border-b text-center">
                        <img src="/images/logo.png" alt="Logo" className="mx-auto h-12 mb-4"/>
                        <h1 className="text-2xl font-bold text-gray-900">Reporte Biométrico de Pisada</h1>
                        <p className="text-gray-600">Análisis estático orientado a plantillas CNC</p>
                    </header>
                    <section className="p-6">
                        <h2 className="text-lg font-bold text-primary-800 mb-4">📄 Datos del Paciente</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="bg-gray-50 p-3 rounded-lg border"><strong>Nombre:</strong><br/>{patientData.nombre}</div>
                            <div className="bg-gray-50 p-3 rounded-lg border"><strong>Edad:</strong><br/>{patientData.edad} años</div>
                            <div className="bg-gray-50 p-3 rounded-lg border"><strong>Sexo:</strong><br/>{patientData.sexo}</div>
                            <div className="bg-gray-50 p-3 rounded-lg border"><strong>Perfil:</strong><br/>{patientData.tipoProblema}</div>
                            <div className="bg-gray-50 p-3 rounded-lg border"><strong>Peso:</strong><br/>{patientData.peso} kg</div>
                            <div className="bg-gray-50 p-3 rounded-lg border"><strong>Talla:</strong><br/>{patientData.talla} cm</div>
                            <div className="bg-gray-50 p-3 rounded-lg border"><strong>IMC:</strong><br/>{patientData.imc}</div>
                            <div className="bg-gray-50 p-3 rounded-lg border"><strong>Calzado:</strong><br/>{patientData.medidaCalzado} ({patientData.unidadCalzado})</div>
                        </div>
                        <div className="mt-6 text-center text-xs text-gray-500">
                             <p>Folio: <span className="font-semibold">{folio}</span> | Fecha: <span className="font-semibold">{reportDate}</span></p>
                        </div>
                    </section>
                </div>
                
                <div className="pdf-page">
                    <section className="p-6 bg-gray-50">
                        <h2 className="text-lg font-bold text-primary-800 mb-4">🔍 Resumen Ejecutivo</h2>
                        <div className="space-y-4 text-gray-700 text-sm whitespace-pre-wrap">
                            <div><h3 className="font-semibold text-gray-800 mb-1">Hallazgos Generales</h3><p>{report.summary.general}</p></div>
                            <div><h3 className="font-semibold text-gray-800 mb-1">Análisis Pie Derecho</h3><p>{report.summary.pieDerecho}</p></div>
                            <div><h3 className="font-semibold text-gray-800 mb-1">Análisis Pie Izquierdo</h3><p>{report.summary.pieIzquierdo}</p></div>
                            <div><h3 className="font-semibold text-gray-800 mb-1">Balance y Simetría</h3><p>{report.summary.balance}</p></div>
                        </div>
                    </section>
                </div>

                <DetailedFootAnalysis side="Derecho" metrics={metrics.right} footDataSide={footData.right} />
                <DetailedFootAnalysis side="Izquierdo" metrics={metrics.left} footDataSide={footData.left} />
                
                <div className="pdf-page">
                     <section className="p-6">
                        <h2 className="text-xl font-bold text-primary-800 mb-6">⚖️ Análisis de Simetría y Balance</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <MetricTile label="Balance de Carga General" value={`${(Math.min(metrics.right.totalLoad, metrics.left.totalLoad) / Math.max(metrics.right.totalLoad, metrics.left.totalLoad) * 100).toFixed(0)}%`} color={getTotalLoadSymmetryColor(metrics.right.totalLoad, metrics.left.totalLoad)} />
                            <MetricTile label="Simetría Arco (Ángulo)" value={`${Math.abs((metrics.right.navicularAngle || 0) - (metrics.left.navicularAngle || 0)).toFixed(1)}° diff.`} color={getSymmetryColor(metrics.right.navicularAngle, metrics.left.navicularAngle, [5, 10], true)} />
                            <MetricTile label="Simetría Talón (Ángulo)" value={`${Math.abs((metrics.right.rearfootAngle || 0) - (metrics.left.rearfootAngle || 0)).toFixed(1)}° diff.`} color={getSymmetryColor(metrics.right.rearfootAngle, metrics.left.rearfootAngle, [4, 8], true)} />
                            <MetricTile label="Simetría Carga Retropié" value={`${Math.abs(metrics.right.retropie - metrics.left.retropie).toFixed(1)}% diff.`} color={getSymmetryColor(metrics.right.retropie, metrics.left.retropie, [5, 10])} />
                            <MetricTile label="Simetría Carga Mediopié" value={`${Math.abs(metrics.right.mediopie - metrics.left.mediopie).toFixed(1)}% diff.`} color={getSymmetryColor(metrics.right.mediopie, metrics.left.mediopie, [5, 10])} />
                            <MetricTile label="Simetría Carga Antepié" value={`${Math.abs(metrics.right.antepie - metrics.left.antepie).toFixed(1)}% diff.`} color={getSymmetryColor(metrics.right.antepie, metrics.left.antepie, [5, 10])} />
                        </div>
                    </section>
                </div>

                <div className="pdf-page">
                    <section className="p-6">
                        <h2 className="text-lg font-bold text-primary-800 mb-4">📋 Recomendaciones</h2>
                        <div className="space-y-6 text-sm">
                            <div><h3 className="font-semibold">Plantilla Anatómica CNC</h3><p className="text-gray-600 mt-1 p-3 bg-gray-50 rounded-md font-mono border">{report.recommendations.cnc}</p></div>
                            <div><h3 className="font-semibold">Calzado Recomendado</h3><ul className="list-disc list-inside text-gray-600 mt-1">{report.recommendations.shoes.map((rec, i) => <li key={i}>{rec}</li>)}</ul></div>
                            <div><h3 className="font-semibold">Ejercicios Correctivos</h3><ul className="list-disc list-inside text-gray-600 mt-1">{report.recommendations.exercises.map((rec, i) => <li key={i}>{rec}</li>)}</ul></div>
                        </div>
                    </section>
                    <footer className="bg-gray-100 p-6 text-xs text-gray-600 border-t pdf-page-break">
                        <h3 className="font-bold text-sm text-gray-800 mb-3 text-center">Aviso Importante y Limitaciones del Análisis</h3>
                        <ul className="space-y-2 list-disc list-inside">
                            <li>
                                <strong>Análisis Orientativo:</strong> Este reporte es una herramienta de apoyo y no constituye un diagnóstico médico. No sustituye una evaluación clínica presencial por un profesional de la salud cualificado.
                            </li>
                            <li>
                                <strong>Responsabilidad del Usuario:</strong> La precisión de este análisis depende fundamentalmente de la calidad y consistencia de las imágenes e información proporcionada. La correcta captura de las fotos y la administración de la información es responsabilidad del usuario.
                            </li>
                            <li>
                                <strong>Análisis Estático:</strong> La evaluación se basa en una postura estática y no captura la biomecánica completa del paciente durante la marcha (al caminar o correr), la cual puede presentar variaciones significativas.
                            </li>
                            <li>
                                <strong>Herramienta de Soporte:</strong> Los resultados generados por algoritmos e inteligencia artificial deben ser interpretados, preferiblemente por un profesional, como un complemento al juicio clínico y no como una conclusión definitiva.
                            </li>
                        </ul>
                        <p className="mt-4 text-center">Proyecto Lazarus - {new Date().getFullYear()}</p>
                    </footer>
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <button type="button" onClick={onBack} className="px-6 py-3 font-semibold text-white bg-gray-500 rounded-lg shadow-md hover:bg-gray-600 transition-colors">Atrás</button>
                <div className="flex gap-3">
                    <button type="button" onClick={downloadPdf} className="px-6 py-3 font-semibold text-white bg-primary-800 rounded-lg shadow-md hover:bg-primary-900 transition-colors">Descargar PDF</button>
                    <button type="button" onClick={handleWhatsAppShare} className="px-6 py-3 font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition-colors">Enviar por WhatsApp</button>
                </div>
            </div>
        </div>
    );
};

export default Step5Results;