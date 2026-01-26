import axios from "axios";
import { createContext, use, useContext, useEffect, useState } from "react"

interface User {
    userId : string,
    name : string
}

interface UserContextType {
    user : User | null,
    loading : boolean
}

const UserContext = createContext<UserContextType>({
    user : null,
    loading : true
});

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
        <UserContext.Provider value={{user, loading}}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);