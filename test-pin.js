import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';

async function testPinCreation() {
  try {
    const form = new FormData();
    form.append('board', '68e9c191e47461ec11417f9b');
    form.append('title', 'Test Pin');
    form.append('description', 'Test Description');
    form.append('media', fs.createReadStream('test.txt'));

    const response = await fetch('http://localhost:3000/api/pins/create', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZTZhYTE5YTc2MDhiZjY4Mzk3ZDlhZCIsImlhdCI6MTc2MDE1MDIxMSwiZXhwIjoxNzYyNzQyMjExfQ.ox0rZk-RvmPCqfTOuiWAgZXq76cIsuu-RwOgXqOmd6I',
        ...form.getHeaders()
      },
      body: form
    });

    const result = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (!response.ok) {
      console.log('Error details:', response.statusText);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPinCreation();
