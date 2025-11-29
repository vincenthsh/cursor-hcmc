import 'dotenv/config';

// --- Configuration ---
const API_KEY = process.env.SUNOAPI_KEY;
const API_URL = 'https://api.sunoapi.org/api/v1/generate';

// --- Input Variables ---
// We append "Short song" to the prompt to influence the duration, 
// though the model ultimately decides the length.
const SONG_PROMPT = "A heartbreaking Country ballad about A wet pair of socks. Minimal intro, no outro. Simple lyrics, Short song, approx 30 seconds.";

// --- Type Definitions based on OpenAPI ---

interface SunoGenerateRequest {
  prompt: string;
  customMode: boolean;
  instrumental: boolean;
  model: 'V4' | 'V4_5' | 'V4_5PLUS' | 'V4_5ALL' | 'V5';
  callBackUrl: string; // Required by API schema
  
  // Optional fields for Custom Mode (not used in this simple script)
  style?: string;
  title?: string;
  negativeTags?: string;
  vocalGender?: 'm' | 'f';
}

interface SunoResponseData {
  taskId: string;
}

interface SunoApiResponse {
  code: number;
  msg: string;
  data: SunoResponseData;
}

// --- Main Function ---

async function generateSong(promptText: string) {
  if (!API_KEY) {
    console.error("❌ Error: SUNOAPI_KEY environment variable is not set.");
    process.exit(1);
  }

  console.log(`🎵 Generating song for prompt: "${promptText}"...`);

  // We use Non-custom Mode (customMode: false) as recommended for simple prompting.
  // This allows the model to generate lyrics based on your description.
  const payload: SunoGenerateRequest = {
    prompt: promptText,
    customMode: false, 
    instrumental: false,
    model: 'V5', // Using V5 for superior expression and speed
    // The API requires a callback URL, even if you don't have a server listening.
    // We use a dummy example URL here.
    callBackUrl: "https://api.example.com/callback" 
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }

    const result = await response.json() as SunoApiResponse;

    if (result.code !== 200) {
      throw new Error(`API Error (${result.code}): ${result.msg}`);
    }

    console.log("\n✅ Request Successful!");
    console.log("------------------------------------------------");
    console.log(`🆔 Task ID: ${result.data.taskId}`);
    console.log("------------------------------------------------");
    console.log("📝 Next Steps:");
    console.log("1. The song is currently generating (Wait ~30-40 seconds).");
    console.log("2. Use the 'Get Music Generation Details' endpoint with the Task ID above to retrieve the MP3 URL.");
    console.log(`   (e.g., GET https://api.sunoapi.org/api/v1/get_task_info?taskId=${result.data.taskId})`);

  } catch (error) {
    console.error("\n❌ Generation Failed:");
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
  }
}

// --- Execution ---
generateSong(SONG_PROMPT);
