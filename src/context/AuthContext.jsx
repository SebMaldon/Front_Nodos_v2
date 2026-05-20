import { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5090';

// Crear el contexto
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Cargar el token y los datos del usuario si existen en localStorage
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setUser(JSON.parse(storedUser));
            // También se podría configurar axios para enviar el token por defecto
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
        setLoading(false);
    }, []);

    const loginUser = (userData, token) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const logoutUser = async () => {
        if (user) {
            try {
                await axios.post(`${API_URL}/api/auth/logout`, { usuario: user.usuario });
            } catch (error) {
                console.error("Error validando el logout", error);
            }
        }
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
    };

    const logoutUserRef = useRef();

    useEffect(() => {
        logoutUserRef.current = logoutUser;
    }, [logoutUser]);

    useEffect(() => {
        let timerId;

        const resetTimer = () => {
            if (timerId) clearTimeout(timerId);
            timerId = setTimeout(() => {
                if (logoutUserRef.current) {
                    logoutUserRef.current();
                }
            }, 15 * 60 * 1000); // 15 minutos de inactividad
        };

        if (user) {
            resetTimer(); // Iniciar cuenta regresiva
            const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
            events.forEach(event => window.addEventListener(event, resetTimer));

            return () => {
                if (timerId) clearTimeout(timerId);
                events.forEach(event => window.removeEventListener(event, resetTimer));
            };
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, loginUser, logoutUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
