export default function PrivacyLoader({ petState }) {
  const memeMap = {
    0: ["/memes/neutral.gif"],
    1: ["/memes/happy.gif"],
    2: ["/memes/sleepy.gif"],
    3: ["/memes/angry.gif"],
    4: ["/memes/grow.gif"],
  };

  const captions = {
    0: "Processing neutral vibes...",
    1: "Encrypting happy vibes 💚",
    2: "Soft sleepy thoughts incoming...",
    3: "Stormy emotions detected ⚡",
    4: "Growing stronger together 🌱",
  };

  const meme = (memeMap[petState] || memeMap[0])[0];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#0f172a",
          padding: "20px",
          borderRadius: "20px",
          border: "1px solid #334155",
          boxShadow: "0 0 30px rgba(0,0,0,0.4)",
          width: "300px",
          textAlign: "center",
        }}
      >
        <img
          src={meme}
          alt="meme"
          style={{
            width: "100%",
            height: "230px",
            borderRadius: "12px",
            objectFit: "cover",
          }}
        />

        <p
          style={{
            marginTop: "12px",
            color: "#10b981",
            fontSize: "12px",
            fontFamily: "monospace",
            textAlign: "center",
          }}
        >
          {captions[petState]}
        </p>
      </div>
    </div>
  );
}
