const testSystem = async () => {
  try {
    console.log("Starting AUTOTEST...");

    // Step A: POST a reservation
    const postPayload = {
      tableId: 1, // Using a generic tableId, assuming 1 exists
      name: "Auto Tester",
      phone: "+47 99999999",
      date: "2026-05-15",
      time: "18:00",
      guests: 2,
      additionalInfo: "AUTOTEST: Peanuts and Logic"
    };

    console.log("Step A: POSTing reservation...");
    const postRes = await fetch('http://localhost:5000/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postPayload)
    });

    if (!postRes.ok) {
      console.error("POST failed:", await postRes.text());
      return;
    }
    const postData = await postRes.json();
    console.log("POST successful, ID:", postData.id);

    // Step B: GET all reservations
    console.log("Step B: GETting all reservations...");
    const getRes = await fetch('http://localhost:5000/reservations');
    
    if (!getRes.ok) {
      console.error("GET failed:", await getRes.text());
      return;
    }
    const getAllData = await getRes.json();

    // Step C: Search the results
    console.log("Step C: Searching results for AUTOTEST string...");
    const found = getAllData.find(r => r.additionalInfo === "AUTOTEST: Peanuts and Logic");

    // Step D: Log results
    if (found) {
      console.log("✅ SUCCESS: Data is alive in the DB!");
    } else {
      console.log("❌ FAIL: Data lost in transit.");
    }

  } catch (error) {
    console.error("Test execution error:", error);
  }
};

testSystem();
