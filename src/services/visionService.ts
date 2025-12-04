
import { DetectionResult } from '../types';

// Access global libraries loaded via <script> tags
const getGlobalTF = () => (window as any).tf;
const getFaceDetection = () => (window as any).faceDetection;
const getHandPoseDetection = () => (window as any).handPoseDetection;

// Use any to avoid hard dependency on types at runtime top-level
let faceDetector: any = null;
let handDetector: any = null;

export const loadModels = async () => {
  try {
    console.log('Checking for global TensorFlow libraries...');
    
    // 1. Wait for Globals to exist
    if (!getGlobalTF()) throw new Error("TensorFlow.js global not found");
    if (!getFaceDetection()) throw new Error("Face Detection global not found");
    if (!getHandPoseDetection()) throw new Error("Hand Pose Detection global not found");

    const tf = getGlobalTF();
    const faceDetectionModule = getFaceDetection();
    const handPoseDetectionModule = getHandPoseDetection();

    // 2. Initialize Backend
    console.log('Setting backend...');
    try {
      // For 'mediapipe' runtime, WebGL is handled internally, but setting tf backend is good practice
      await tf.setBackend('webgl');
      console.log('Backend set to WebGL');
    } catch (e) {
      console.warn('WebGL failed, falling back to CPU');
      await tf.setBackend('cpu');
    }
    await tf.ready();
    
    // 3. Load Face Detector
    // Using 'mediapipe' runtime for best performance. Requires @mediapipe/face_detection script in HTML.
    console.log('Loading Face Detector (MediaPipe Runtime)...');
    const faceModel = faceDetectionModule.SupportedModels.MediaPipeFaceDetector;
    const faceDetectorConfig = {
      runtime: 'mediapipe',
      solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection', 
      maxFaces: 1,
      modelType: 'short'
    };
    faceDetector = await faceDetectionModule.createDetector(faceModel, faceDetectorConfig);

    // 4. Load Hand Detector
    // Using 'mediapipe' runtime. Requires @mediapipe/hands script in HTML.
    console.log('Loading Hand Detector (MediaPipe Runtime)...');
    const handModel = handPoseDetectionModule.SupportedModels.MediaPipeHands;
    const handDetectorConfig = {
      runtime: 'mediapipe',
      solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
      maxHands: 1,
      modelType: 'lite'
    };
    handDetector = await handPoseDetectionModule.createDetector(handModel, handDetectorConfig);

    console.log('Models loaded successfully');
  } catch (error) {
    console.error('Error in loadModels:', error);
    throw error;
  }
};

export const detectFeatures = async (video: HTMLVideoElement): Promise<DetectionResult> => {
  const result: DetectionResult = {
    isLookingAtCamera: false,
    handPosition: null,
    handPose: 'closed',
    faceKeypoints: [],
    handKeypoints: []
  };

  try {
    // 1. Face Detection
    if (faceDetector) {
      const faces = await faceDetector.estimateFaces(video, { flipHorizontal: true });
      if (faces.length > 0) {
        const keypoints = faces[0].keypoints;
        
        // Normalize and store for debug
        result.faceKeypoints = keypoints.map((k: any) => ({
            x: k.x / video.videoWidth,
            y: k.y / video.videoHeight,
            name: k.name
        }));

        // MediaPipe Face Detector keypoints: noseTip, rightEarTragion, leftEarTragion, etc.
        const nose = keypoints.find((k: any) => k.name === 'noseTip');
        const rightEar = keypoints.find((k: any) => k.name === 'rightEarTragion');
        const leftEar = keypoints.find((k: any) => k.name === 'leftEarTragion');

        if (nose && rightEar && leftEar) {
          const distToRightEar = Math.abs(nose.x - rightEar.x);
          const distToLeftEar = Math.abs(nose.x - leftEar.x);
          
          // Ratio logic: If looking straight, distances are roughly equal.
          const ratio = distToRightEar / (distToLeftEar + 0.01);
          
          // Thresholds for "looking straight"
          if (ratio > 0.4 && ratio < 2.5) {
            result.isLookingAtCamera = true;
          }
        }
      }
    }

    // 2. Hand Detection
    if (handDetector) {
      const hands = await handDetector.estimateHands(video, { flipHorizontal: true });
      if (hands.length > 0) {
        const keypoints = hands[0].keypoints;
        
        // Store normalized keypoints for debug
        result.handKeypoints = keypoints.map((k: any) => ({
            x: k.x / video.videoWidth,
            y: k.y / video.videoHeight,
            name: k.name
        }));

        const indexTip = keypoints.find((k: any) => k.name === 'index_finger_tip');

        if (indexTip) {
          result.handPosition = {
            x: indexTip.x / video.videoWidth,
            y: indexTip.y / video.videoHeight
          };
        }

        // Determine Hand Pose using Distance from Wrist (Rotation Invariant)
        const wrist = keypoints.find((k: any) => k.name === 'wrist');
        const getDist = (k1: any, k2: any) => Math.hypot(k1.x - k2.x, k1.y - k2.y);
        
        if (wrist) {
            // Check if fingers are extended (Tip is further from wrist than PIP joint)
            const isFingerExtended = (tipName: string, pipName: string) => {
                const tip = keypoints.find((k: any) => k.name === tipName);
                const pip = keypoints.find((k: any) => k.name === pipName);
                if (!tip || !pip) return false;
                return getDist(tip, wrist) > getDist(pip, wrist);
            };

            const indexExt = isFingerExtended('index_finger_tip', 'index_finger_pip');
            const middleExt = isFingerExtended('middle_finger_tip', 'middle_finger_pip');
            const ringExt = isFingerExtended('ring_finger_tip', 'ring_finger_pip');
            const pinkyExt = isFingerExtended('pinky_finger_tip', 'pinky_finger_pip');

            // Logic:
            // Pointing: Index extended, others (at least middle/ring) curled
            // Open: Index, Middle, Ring extended
            // Closed: Most curled
            
            if (indexExt && !middleExt && !ringExt) {
                result.handPose = 'pointing';
            } else if (indexExt && middleExt && ringExt) {
                result.handPose = 'open';
            } else {
                result.handPose = 'closed';
            }
        }
      }
    }

  } catch (e) {
    // Silent catch to prevent loop spam
    // console.error("Detection loop error", e);
  }

  return result;
};