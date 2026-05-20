import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

const API_URL = 'http://localhost:5090';

const Login = () => {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { loginUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, {
                usuario,
                password
            });

            // Si es exitoso, guardar datos y redirigir
            const { token, usuario: user, role, id_unidad } = response.data;
            loginUser({ usuario: user, role, id_unidad: id_unidad ?? null }, token);
            navigate('/'); // Redirigir a inicio u otra página

        } catch (err) {
            console.error('Error al iniciar sesión:', err);
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError('Error al conectar con el servidor. Inténtelo de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <img src="/IMSS_LogosímboloLetras.png" alt="Logo IMSS" className="login-logo" />
                    <h2>Sistema de Gestión de Nodos</h2>
                    <p>Inicie sesión con su cuenta de administrador</p>
                </div>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label htmlFor="usuario">Usuario</label>
                        <div className="input-with-icon">
                            <i className="fas fa-user"></i>
                            <input
                                type="text"
                                id="usuario"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                placeholder="Ingrese su usuario"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <div className="input-with-icon">
                            <i className="fas fa-lock"></i>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Ingrese su contraseña"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Iniciando sesión...' : 'Ingresar al sistema'}
                    </button>

                    <div className="login-footer">
                        <p>Solo personal autorizado IMSS.</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
