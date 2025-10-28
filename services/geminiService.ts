import { GoogleGenAI, Type } from "@google/genai";
import type { PatientData, FootMetrics, FootData, ReportData } from '../types.ts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function fileToGenerativePart(base64: string) {
    const match = base64.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
        throw new Error('Invalid base64 string for image');
    }
    return {
        inlineData: {
            data: match[2],
            mimeType: match[1],
        },
    };
}


function buildPrompt(patientData: PatientData, rightMetrics: FootMetrics, leftMetrics: FootMetrics, hasShoeWearImage: boolean): string {
    const symmetry = (Math.min(rightMetrics.totalLoad, leftMetrics.totalLoad) / Math.max(rightMetrics.totalLoad, leftMetrics.totalLoad)) * 100;

    let shoeWearInstruction = '';
    if (hasShoeWearImage) {
        shoeWearInstruction = `**Crucially, you will be provided with images of the patient's shoe wear pattern. Analyze these images to identify zones of major wear (e.g., medial heel, lateral forefoot). Correlate these DYNAMIC findings from the shoe wear with the STATIC analysis data to confirm or refine your diagnosis. For example, if the static analysis suggests a flat foot and the shoe wear shows excessive medial wear (overpronation), highlight this as a strong confirmation.**`;
    }

    return `
You are a world-class podiatrist and biomechanics expert. Your task is to analyze the following patient data from a static foot scan and generate a concise executive summary and clinical recommendations in Spanish. Be clear and direct, as your audience is a prosthetics professional.

**Patient Data:**
- Age: ${patientData.edad}
- Sex: ${patientData.sexo}
- Weight: ${patientData.peso} kg
- Height: ${patientData.talla} cm
- BMI: ${patientData.imc}
- Clinical Profile: ${patientData.tipoProblema}
- Questionnaire Responses: ${JSON.stringify(patientData.cuestionarioRespuestas, null, 2)}

**Biometric Analysis:**
- Overall Load Symmetry: ${symmetry.toFixed(1)}%
- Right Foot:
  - Arch Type (Final Diagnosis): ${rightMetrics.archType}
  - Structural Navicular Angle: ${rightMetrics.navicularAngle ? rightMetrics.navicularAngle.toFixed(1) + ' degrees' : 'N/A'}
  - Functional Midfoot Contact Ratio: ${rightMetrics.midfootPressureRatio ? (rightMetrics.midfootPressureRatio * 100).toFixed(1) + '%' : 'N/A'}
  - Rearfoot Alignment Angle (Varo/Valgo): ${rightMetrics.rearfootAngle ? rightMetrics.rearfootAngle.toFixed(1) + ' degrees' : 'N/A'}
  - Load Distribution: Retropie ${rightMetrics.retropie.toFixed(1)}%, Mediopie ${rightMetrics.mediopie.toFixed(1)}%, Antepie ${rightMetrics.antepie.toFixed(1)}%
- Left Foot:
  - Arch Type (Final Diagnosis): ${leftMetrics.archType}
  - Structural Navicular Angle: ${leftMetrics.navicularAngle ? leftMetrics.navicularAngle.toFixed(1) + ' degrees' : 'N/A'}
  - Functional Midfoot Contact Ratio: ${leftMetrics.midfootPressureRatio ? (leftMetrics.midfootPressureRatio * 100).toFixed(1) + '%' : 'N/A'}
  - Rearfoot Alignment Angle (Varo/Valgo): ${leftMetrics.rearfootAngle ? leftMetrics.rearfootAngle.toFixed(1) + ' degrees' : 'N/A'}
  - Load Distribution: Retropie ${leftMetrics.retropie.toFixed(1)}%, Mediopie ${leftMetrics.mediopie.toFixed(1)}%, Antepie ${leftMetrics.antepie.toFixed(1)}%

**Task:**
Based on the data, provide a structured JSON response. All output MUST BE IN SPANISH.
1. A structured executive summary with four sections:
   - \`general\`: General findings about the patient's profile and main biomechanical issues.
   - \`pieDerecho\`: Specific analysis for the right foot, correlating all findings.
   - \`pieIzquierdo\`: Specific analysis for the left foot, correlating all findings.
   - \`balance\`: Analysis of balance and symmetry between both feet.
2. ${shoeWearInstruction}
3. CNC insole recommendations (\`cnc\`): Suggest specific, technical parameters for a custom CNC-milled insole.
4. Footwear recommendations (\`shoes\`): Suggest 3 features for appropriate footwear.
5. Corrective exercises (\`exercises\`): Suggest 2 simple corrective exercises.
`;
}

export async function generateExecutiveSummary(patientData: PatientData, rightMetrics: FootMetrics, leftMetrics: FootMetrics, footData: FootData): Promise<ReportData> {
    const errorSummary = {
        general: "Error al generar el resumen de hallazgos generales.",
        pieDerecho: "Error al generar el análisis del pie derecho.",
        pieIzquierdo: "Error al generar el análisis del pie izquierdo.",
        balance: "Error al generar el análisis de balance."
    };
    const errorRecommendations = { cnc: "Error en la generación.", shoes: ["N/A"], exercises: ["N/A"] };

    if (!process.env.API_KEY) {
        return {
            summary: { ...errorSummary, general: "API Key no configurada. El análisis de IA no está disponible." },
            recommendations: { cnc: "N/A", shoes: [], exercises: [] }
        };
    }
    
    const hasShoeWear = !!footData.right.shoeWear || !!footData.left.shoeWear;
    const promptText = buildPrompt(patientData, rightMetrics, leftMetrics, hasShoeWear);
    
    const contents: any[] = [{ text: promptText }];

    if (footData.right.shoeWear) {
        contents.push({ text: "Desgaste del zapato derecho:" });
        contents.push(fileToGenerativePart(footData.right.shoeWear));
    }
    if (footData.left.shoeWear) {
        contents.push({ text: "Desgaste del zapato izquierdo:" });
        contents.push(fileToGenerativePart(footData.left.shoeWear));
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: contents },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: {
                            type: Type.OBJECT,
                            description: "The structured executive summary in Spanish.",
                            properties: {
                                general: {
                                    type: Type.STRING,
                                    description: "Hallazgos generales sobre el perfil del paciente y principales problemas biomecánicos.",
                                },
                                pieDerecho: {
                                    type: Type.STRING,
                                    description: "Análisis específico del pie derecho, correlacionando todos los hallazgos (presión, ángulos, etc.).",
                                },
                                pieIzquierdo: {
                                    type: Type.STRING,
                                    description: "Análisis específico del pie izquierdo, correlacionando todos los hallazgos.",
                                },
                                balance: {
                                    type: Type.STRING,
                                    description: "Análisis del balance y la simetría entre ambos pies, destacando asimetrías significativas.",
                                }
                            },
                            required: ["general", "pieDerecho", "pieIzquierdo", "balance"]
                        },
                        recommendations: {
                            type: Type.OBJECT,
                            properties: {
                                cnc: {
                                    type: Type.STRING,
                                    description: "Suggest specific parameters for a custom CNC-milled insole in Spanish. Be technical (e.g., 'Medial heel skive of 4mm on the right foot', 'Metatarsal pad proximal to 2-4 met heads', 'Deep heel cup for stability').",
                                },
                                shoes: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING },
                                    description: "List of 3 features for appropriate footwear, in Spanish.",
                                },
                                exercises: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING },
                                    description: "List of 2 simple corrective exercises, in Spanish.",
                                }
                            },
                            required: ["cnc", "shoes", "exercises"],
                        },
                    },
                    required: ["summary", "recommendations"],
                }
            }
        });
        
        const text = response.text.trim();
        const parsedResponse = JSON.parse(text);

        return {
            summary: parsedResponse.summary || errorSummary,
            recommendations: parsedResponse.recommendations || errorRecommendations,
        };
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return {
            summary: { ...errorSummary, general: "Hubo un error al generar el resumen con IA. Por favor, revise la consola para más detalles." },
            recommendations: errorRecommendations,
        };
    }
}