import api from "./axios";

export interface SignupPayload {
    name : string,
    email : string,
    password : string
}

export interface LoginPayload {
    email : string,
    password : string
}


export const signup = async(data : SignupPayload)=>{
    const res = await api.post('/auth/signup', {
        name : data.name,
        email : data.email,
        password : data.password
    });
    return res.data;
}


export const login = async(data : LoginPayload )=>{
    const res = await api.post('/auth/login', {
        email : data.email,
        password : data.password
    });
    return res.data;
}

