const body = {
  "id": "6a941ab97b1ba9cd02f540c1",
  "inv": "INV-0013",
  "mid": "6a8d27044b012d64d00239c1",
  "cn": "gvc",
  "ce": "",
  "tot": "0.01",
  "sub": "0.01",
  "cur": "USD",
  "due": "2026-09-13",
  "adr": "0xFC54E8088090b4E56AF07391d6c179E38F3DC8ab",
  "st": "paid",
  "it": [
    {
      "id": "item-1",
      "d": "Development & Consultingvvcg Services",
      "q": 1,
      "p": "0.01",
      "a": "0.01"
    }
  ],
  "status": "paid",
  "paymentId": "0x123abc..."
};

fetch("http://localhost:3000/api/invoices/sync", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
