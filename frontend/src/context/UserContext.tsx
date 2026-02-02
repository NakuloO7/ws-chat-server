import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react"

interface User {
    userId : string,
    name : string
}

interface UserContextType {
    user : User | null,
    loading : boolean,
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({children} : {children : React.ReactNode})=>{
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(()=>{
        axios.get("http://localhost:3000/auth/me", {
            withCredentials : true
        })
        .then((res)=>setUser(res.data))
        .catch(()=>setUser(null))
        .finally(()=> setLoading(false));
    }, [])

    return (
        <UserContext.Provider value={{user, loading, setUser}}>
            {children}
        </UserContext.Provider>
    );
};


export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};