// Verification script to test live YouCam Makeup-VTO API capabilities with custom vanity hex shades
const API_KEY = process.env.EXPO_PUBLIC_YOUCAM_API_KEY || 'sk-b3CjyjDcKf6SnG1vRBQEmEJZ7BZro4Q8eDWkvwX-ZzjheGxo8GzGm4N-jKk5A2YC';
const BASE_URL = 'https://yce-api-01.perfectcorp.com';

async function testApi() {
  console.log('--- 1. Testing Auth Headers & S2S Ping ---');
  const pingRes = await fetch(`${BASE_URL}/s2s/v2.0/task/makeup-vto`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      version: '1.0',
      src_file_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
      effects: [
        { category: 'skin_smooth', skinSmoothStrength: 40, skinSmoothColorIntensity: 25 },
        {
          category: 'foundation',
          palettes: [
            {
              color: '#7a4f2e', // Custom user vanity shade test (NARS Macao / swatch)
              colorIntensity: 85,
              glowIntensity: 35,
              coverageIntensity: 85,
            },
          ],
        },
      ],
    }),
  });

  console.log('HTTP Status:', pingRes.status);
  const data = await pingRes.json();
  console.log('Response payload:', JSON.stringify(data, null, 2));

  if (data?.data?.task_id) {
    const taskId = data.data.task_id;
    console.log('\n--- 2. Polling task status for TaskId:', taskId, '---');
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      const pollRes = await fetch(`${BASE_URL}/s2s/v2.0/task/makeup-vto/${taskId}`, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'x-api-key': API_KEY,
        },
      });
      const pollData = await pollRes.json();
      const status = pollData?.data?.task_status;
      console.log(`Poll [${i + 1}]: status = ${status}`);
      if (status === 'success') {
        console.log('\n🎉 SUCCESS! Rendered Try-On Image URL:');
        console.log(pollData.data.results?.url || pollData.data.results);
        break;
      }
      if (status === 'error') {
        console.log('Task Error:', pollData.data.error_message);
        break;
      }
    }
  }
}

testApi().catch((err) => console.error('Test failed with error:', err));
