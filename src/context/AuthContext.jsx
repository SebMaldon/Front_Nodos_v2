import { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Crear el contexto
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Interceptor global para manejar bloqueos del proxy institucional/intranet
        const interceptor = axios.interceptors.response.use(
            (response) => {
                // Si recibimos HTML/XML (posible portal cautivo, proxy institucional o error de IIS) en vez de JSON
                const isHtml = typeof response.data === 'string' && (
                    response.data.trim().startsWith('<') ||
                    response.data.toLowerCase().includes('<html') ||
                    response.data.toLowerCase().includes('<body') ||
                    response.data.toLowerCase().includes('<!doctype')
                );
                
                if (isHtml) {
                    const config = response.config;
                    config.retryCount = config.retryCount || 0;
                    
                    if (config.retryCount < 3) {
                        config.retryCount += 1;
                        console.warn(`Posible intercepción de proxy/portal detectada en ${config.url}. Reintentando petición (${config.retryCount}/3)...`);
                        return new Promise((resolve) => {
                            setTimeout(() => {
                                const token = localStorage.getItem('token');
                                if (token && config.headers) {
                                    config.headers['Authorization'] = `Bearer ${token}`;
                                }
                                resolve(axios(config));
                            }, 800);
                        });
                    } else {
                        // Si después de 3 reintentos sigue fallando, es mejor rechazar que pasar HTML al sistema
                        return Promise.reject(new Error("Proxy o portal cautivo bloqueando permanentemente la conexión."));
                    }
                }
                return response;
            },
            (error) => {
                const config = error.config;
                // Manejar cortes de red temporales o fallos de proxy (502, 503, 504)
                if (config && config.retryCount === undefined) {
                    config.retryCount = 0;
                }
                
                const isNetworkOrProxyError = !error.response || 
                    error.message === 'Network Error' || 
                    error.code === 'ERR_NETWORK' || 
                    error.code === 'ECONNABORTED' ||
                    (error.response && [502, 503, 504].includes(error.response.status));

                if (config && config.retryCount < 3 && isNetworkOrProxyError) {
                    config.retryCount += 1;
                    console.warn(`Error temporal de red o proxy en ${config.url}. Reintentando petición (${config.retryCount}/3)...`);
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            const token = localStorage.getItem('token');
                            if (token && config.headers) {
                                config.headers['Authorization'] = `Bearer ${token}`;
                            }
                            resolve(axios(config));
                        }, 800);
                    });
                }
                return Promise.reject(error);
            }
        );

        // Cargar el token y los datos del usuario si existen en localStorage
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                // Decodificar el payload del JWT
                const payloadBase64 = storedToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
                const decodedPayload = JSON.parse(atob(payloadBase64));
                const isExpired = decodedPayload.exp * 1000 < Date.now();

                if (isExpired) {
                    // Token expirado, limpiar la sesión
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                } else {
                    setUser(JSON.parse(storedUser));
                    // También se podría configurar axios para enviar el token por defecto
                    axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                }
            } catch (error) {
                console.error("Error al validar el token", error);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setLoading(false);

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
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
            }, 8 * 60 * 60 * 1000); // 8 horas de inactividad
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
