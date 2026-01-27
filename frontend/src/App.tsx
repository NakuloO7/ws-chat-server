import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { Signup } from "./pages/Signup";
import { Login } from "./pages/Login";
import { Chat } from "./pages/Chat";
import { Rooms } from "./pages/Room";

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path = "/" element={<Navigate to="/login"/>}/>
      <Route path = "/signup" element={<Signup/>}/>
      <Route path = "/login" element={<Login/>}/>
      <Route path="/rooms" element={<Rooms/>}/>
      <Route path = "/chat/:roomId" element={<Chat/>}/>
      <Route path="*" element={<Navigate to="/rooms" />} />
    </Routes>
    </BrowserRouter>
  );
}

export default App;
