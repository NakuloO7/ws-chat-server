import { useNavigate } from "react-router-dom";
import { PUBLIC_ROOMS } from "../constants/rooms";
import { useUser } from "../context/UserContext";
import axios from "axios";

export const Rooms = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:3000/auth/logout",
        {},
        { withCredentials: true },
      );
      setUser(null); // clear user context
      navigate("/login"); // redirect
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
   <div className="min-h-screen bg-zinc-950 text-white p-6 relative">
      <h1 className="text-2xl font-semibold mb-6">Choose a room</h1>

      <div className="grid gap-4">
        {PUBLIC_ROOMS.map((room) => (
          <button
            key={room.id}
            onClick={() => navigate(`/chat/${room.id}`)}
            className="p-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition text-left"
          >
            <h2 className="text-lg font-medium">{room.name}</h2>
            <p className="text-sm text-zinc-400">{room.description}</p>
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="fixed bottom-6 right-6 text-xs text-zinc-400 hover:text-white transition"
      >
        Logout
      </button>
    </div>
  );
};
