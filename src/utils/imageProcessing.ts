import type { SelectionRect, FootDataSide, FootMetrics, Point, FootSide } from '../types';

export async function processImageToHeatmap(
    base64Image: string,
    selection: SelectionRect,
    containerSize: { width: number; height: number },
    naturalWidth: number,
    naturalHeight: number
): Promise<{ cropped: string; grayscale: string; heatmap: string }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const scaleX = naturalWidth / containerSize.width;
            const scaleY = naturalHeight / containerSize.height;

            const srcX = selection.x * scaleX;
            const srcY = selection.y * scaleY;
            const srcWidth = selection.width * scaleX;
            const srcHeight = selection.height * scaleY;

            // 1. Cropped image
            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = srcWidth;
            cropCanvas.height = srcHeight;
            const cropCtx = cropCanvas.getContext('2d');
            if (!cropCtx) return reject("Could not get crop canvas context");
            cropCtx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, srcWidth, srcHeight);
            const cropped = cropCanvas.toDataURL('image/png');

            // 2. Grayscale image
            const grayCanvas = document.createElement('canvas');
            grayCanvas.width = srcWidth;
            grayCanvas.height = srcHeight;
            const grayCtx = grayCanvas.getContext('2d');
            if (!grayCtx) return reject("Could not get gray canvas context");
            grayCtx.drawImage(cropCanvas, 0, 0);
            const imageData = grayCtx.getImageData(0, 0, srcWidth, srcHeight);
            const data = imageData.data;
            
            // Correct grayscale conversion: light areas in original image result in high gray values (high pressure)
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // Luminosity method for a more perceptually accurate grayscale
                const avg = 0.299 * r + 0.587 * g + 0.114 * b;
                data[i] = avg;     // red
                data[i + 1] = avg; // green
                data[i + 2] = avg; // blue
            }
            grayCtx.putImageData(imageData, 0, 0);
            const grayscale = grayCanvas.toDataURL('image/png');

            // 3. Heatmap
            const heatmapCanvas = document.createElement('canvas');
            heatmapCanvas.width = srcWidth;
            heatmapCanvas.height = srcHeight;
            const heatmapCtx = heatmapCanvas.getContext('2d');
            if (!heatmapCtx) return reject("Could not get heatmap canvas context");
            
            const grayImg = new Image();
            grayImg.onload = () => {
                heatmapCtx.drawImage(grayImg, 0, 0);
                const heatmapImageData = heatmapCtx.getImageData(0, 0, srcWidth, srcHeight);
                const heatmapData = heatmapImageData.data;

                const grayValues = [];
                for(let i = 0; i < heatmapData.length; i+=4) {
                    if (heatmapData[i] > 10) { 
                        grayValues.push(heatmapData[i]);
                    }
                }
                
                if (grayValues.length === 0) {
                     heatmapCtx.fillStyle = 'black';
                     heatmapCtx.fillRect(0, 0, srcWidth, srcHeight);
                     resolve({ cropped, grayscale, heatmap: heatmapCanvas.toDataURL('image/png') });
                     return;
                }

                const sortedGrays = [...grayValues].sort((a, b) => a - b);
                // Use percentiles to avoid outliers compressing the color range
                const minGray = sortedGrays[Math.floor(sortedGrays.length * 0.02)];
                const maxGray = sortedGrays[Math.floor(sortedGrays.length * 0.98)];
                const range = maxGray - minGray;
                
                const colors = [
                    { r: 0, g: 0, b: 255 },    // Blue (low pressure)
                    { r: 0, g: 255, b: 255 },  // Cyan
                    { r: 0, g: 255, b: 0 },    // Green
                    { r: 255, g: 255, b: 0 },  // Yellow
                    { r: 255, g: 0, b: 0 }     // Red (max pressure)
                ];

                for (let i = 0; i < heatmapData.length; i += 4) {
                    const gray = heatmapData[i];
                    
                    if (gray <= 10) { 
                        heatmapData[i] = 0;
                        heatmapData[i + 1] = 0;
                        heatmapData[i + 2] = 0;
                        continue;
                    }

                    let normalized = range > 0 ? (gray - minGray) / range : 0.5;
                    normalized = Math.max(0, Math.min(1, normalized));
                    
                    const gamma = 0.6;
                    const t = Math.pow(normalized, gamma);

                    const colorStops = colors.length - 1;
                    const scaledT = t * colorStops;
                    const index = Math.min(Math.floor(scaledT), colorStops - 1);
                    const fraction = scaledT - index;

                    const c1 = colors[index];
                    const c2 = colors[index + 1] || colors[index];

                    const r = c1.r + (c2.r - c1.r) * fraction;
                    const g = c1.g + (c2.g - c1.g) * fraction;
                    const b = c1.b + (c2.b - c1.b) * fraction;
                    
                    heatmapData[i] = r;
                    heatmapData[i + 1] = g;
                    heatmapData[i + 2] = b;
                }
                heatmapCtx.putImageData(heatmapImageData, 0, 0);
                const heatmap = heatmapCanvas.toDataURL('image/png');
                
                resolve({ cropped, grayscale, heatmap });
            };
            grayImg.src = grayscale;
        };
        img.onerror = reject;
        img.src = base64Image;
    });
}

async function getMetricsFromCanvas(canvasDataUrl: string): Promise<Pick<FootMetrics, 'antepie' | 'mediopie' | 'retropie' | 'indiceArco' | 'totalLoad' | 'midfootPressureRatio'>> {
     return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if(!ctx) return;

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const { width, height } = canvas;
            
            let forefootPressure = 0, midfootPressure = 0, rearfootPressure = 0;
            const rearfootEndRow = height * 0.35;
            const midfootStartRow = rearfootEndRow;
            const midfootEndRow = height * 0.65;
            const forefootStartRow = midfootEndRow;
            
            let midfootContactWidthSum = 0;
            let midfootRowsWithContact = 0;

            for (let y = 0; y < height; y++) {
                let rowContactLeft = width;
                let rowContactRight = 0;

                for (let x = 0; x < width; x++) {
                    const i = (y * width + x) * 4;
                    const grayValue = data[i]; // High gray value now correctly means high pressure
                    const pressure = grayValue;

                    if (pressure > 20) { // Threshold to ignore background noise
                        if (y < rearfootEndRow) rearfootPressure += pressure;
                        else if (y >= forefootStartRow) forefootPressure += pressure;
                        else midfootPressure += pressure;
                        
                        if (y >= midfootStartRow && y < midfootEndRow) {
                           rowContactLeft = Math.min(rowContactLeft, x);
                           rowContactRight = Math.max(rowContactRight, x);
                        }
                    }
                }
                
                if (rowContactRight > rowContactLeft) {
                    midfootContactWidthSum += (rowContactRight - rowContactLeft);
                    midfootRowsWithContact++;
                }
            }
            
            const avgMidfootContactWidth = midfootRowsWithContact > 0 ? midfootContactWidthSum / midfootRowsWithContact : 0;
            const midfootPressureRatio = width > 0 ? avgMidfootContactWidth / width : 0;


            const totalPressure = forefootPressure + midfootPressure + rearfootPressure;
            if (totalPressure === 0) {
                 resolve({ antepie: 40, retropie: 40, mediopie: 20, indiceArco: 0.6, totalLoad: 1, midfootPressureRatio: 0.33 });
                 return;
            }
            
            const antepie = (forefootPressure / totalPressure) * 100;
            const retropie = (rearfootPressure / totalPressure) * 100;
            const mediopie = (midfootPressure / totalPressure) * 100;
            
            const indiceArco = 1 - midfootPressureRatio;

            resolve({
                antepie,
                retropie,
                mediopie,
                indiceArco: Math.max(0.1, Math.min(0.9, indiceArco)),
                totalLoad: totalPressure,
                midfootPressureRatio
            });
        };
        img.src = canvasDataUrl;
    });
}

function getContactArea(footData: FootDataSide) {
    if (!footData.footMeasurement || !footData.selectionRect) return null;
    const realLengthCm = footData.footMeasurement;
    const selectionHeightPx = footData.selectionRect.height;
    if (selectionHeightPx <= 0) return null;

    const scale = realLengthCm / selectionHeightPx;
    const realWidthCm = footData.selectionRect.width * scale;
    const areaCm2 = realLengthCm * realWidthCm * 0.75; 
    return { length: realLengthCm, width: realWidthCm, area: areaCm2 };
}

export function calculateNavicularAngle(points: { p1: Point; p2: Point; p3: Point }): number {
    const { p1, p2, p3 } = points; // p3 is the vertex (navicular)
    const a = { x: p1.x - p3.x, y: p1.y - p3.y };
    const b = { x: p2.x - p3.x, y: p2.y - p3.y };

    const dotProduct = a.x * b.x + a.y * b.y;
    const magA = Math.sqrt(a.x * a.x + a.y * a.y);
    const magB = Math.sqrt(b.x * b.x + b.y * b.y);

    if (magA === 0 || magB === 0) return 0;
    
    // Clamp the value to avoid Math.acos errors due to floating point inaccuracies
    const cosTheta = Math.max(-1, Math.min(1, dotProduct / (magA * magB)));

    const angleRad = Math.acos(cosTheta);
    return angleRad * (180 / Math.PI);
}

// FIX: Replaced the complex and potentially buggy angle calculation with a more robust method using atan2 for better data consistency.
export function calculateRearfootAngle(lines: { calf: [Point, Point], heel: [Point, Point] }, side: FootSide): number {
    const getAngle = (p1: Point, p2: Point) => Math.atan2(p2.y - p1.y, p2.x - p1.x);

    const angleCalf = getAngle(lines.calf[0], lines.calf[1]);
    const angleHeel = getAngle(lines.heel[0], lines.heel[1]);
    
    let angleDiff = (angleHeel - angleCalf) * (180 / Math.PI);

    // Normalize angle to be between -180 and 180
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;

    // The clinical interpretation depends on the side. We normalize it so that:
    // Positive (+) is always Valgus (eversion)
    // Negative (-) is always Varus (inversion)
    // For a right foot, a clockwise deviation of the heel line relative to the calf line is valgus.
    // This typically results in a negative angleDiff from our calculation.
    // For a left foot, a counter-clockwise deviation is valgus, resulting in a positive angle.
    // To normalize, we flip the sign for the right foot.
    if (side === 'right') {
        return -angleDiff;
    }

    return angleDiff;
}


export async function calculateAllMetrics(footData: FootDataSide, side: FootSide): Promise<FootMetrics> {
    if (!footData.step2Canvas) throw new Error("Grayscale canvas data is missing for metrics calculation.");
    
    const metrics = await getMetricsFromCanvas(footData.step2Canvas);
    const navicularAngle = footData.medialTrianglePoints ? calculateNavicularAngle(footData.medialTrianglePoints) : null;
    const rearfootAngle = footData.posteriorLinePoints ? calculateRearfootAngle(footData.posteriorLinePoints, side) : null;
    
    let archScore = 0;
    
    // 1. Structural Angle (Medial View) - High weight
    if (navicularAngle) {
        if (navicularAngle > 155) archScore += 2; // Strong indicator of flat foot
        else if (navicularAngle < 135) archScore -= 2; // Strong indicator of high arch
    }

    // 2. Functional Pressure (Midfoot Contact) - Medium weight
    if (metrics.midfootPressureRatio) {
        // If more than ~40% of midfoot width has contact, suggests flattening
        if (metrics.midfootPressureRatio > 0.40) archScore += 1; 
        // If less than ~15%, suggests a high arch with little contact
        else if (metrics.midfootPressureRatio < 0.15) archScore -= 1;
    }
    
    // 3. Rearfoot Alignment (Posterior View) - Medium weight
    if (rearfootAngle) {
        if (rearfootAngle > 4) archScore += 1; // Valgus correlates with flat foot
        else if (rearfootAngle < -4) archScore -= 1; // Varus correlates with high arch
    }

    let archType: 'plano' | 'cavo' | 'neutro' = 'neutro';
    if (archScore >= 2) archType = 'plano';
    else if (archScore <= -2) archType = 'cavo';
    
    return {
        ...metrics,
        archType,
        contactArea: getContactArea(footData),
        navicularAngle,
        rearfootAngle,
    };
}