import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Shield, User, Lock, Eye, EyeOff, LogIn, CheckCircle2, Network, Wrench, Image as ImageIcon, Database } from 'lucide-react';

const API_URL = 'http://localhost:5090';

const Login = () => {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
            const { token, usuario: user, role, zona } = response.data;
            loginUser({ usuario: user, role, zona: zona ?? null }, token);
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
        <div className="min-h-screen bg-[#075940] flex flex-col md:flex-row relative overflow-hidden font-sans">
            {/* Left Section - Branding & Info */}
            <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 z-10 text-white">
                <div className="mb-12">
                    <div className="mb-10">
                        <img src="/IMSS_Logosímbolo_Blanco.png" alt="Logo IMSS Blanco" className="h-16 md:h-20 object-contain drop-shadow-md" />
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-2">
                        Sistema de <br />
                        <span className="text-yellow-500">Gestión de Nodos</span>
                    </h1>
                    
                    <p className="text-green-50/80 mt-6 max-w-xl text-lg md:text-xl font-light">
                        Plataforma institucional para el control, seguimiento y mantenimiento de la infraestructura de red (Nodos, MDF e IDF) de la Delegación Nayarit.
                    </p>
                </div>

                <div className="space-y-5 mt-8 md:mt-12 text-sm md:text-base font-medium text-green-50/90">
                    <div className="flex items-center gap-4">
                        <Network size={20} className="text-orange-400" />
                        <span>Control completo del inventario de nodos de red</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Wrench size={20} className="text-blue-400" />
                        <span>Registro de mantenimientos y estado del cableado</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <ImageIcon size={20} className="text-yellow-400" />
                        <span>Administración de imágenes y diagramas de red</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Database size={20} className="text-gray-300" />
                        <span>Gestión de ubicaciones, switches y equipos MDF/IDF</span>
                    </div>
                </div>

                {/* Left Bottom Footer */}
                <div className="absolute bottom-8 left-8 md:left-16 lg:left-24">
                    <div className="flex items-center gap-2 mb-1">
                        <Shield size={14} className="text-yellow-500" />
                        <span className="text-yellow-500 text-xs font-semibold">Sistema de Nodos v2.0.1</span>
                    </div>
                    <p className="text-[10px] text-green-200/60 font-medium tracking-wide">
                        Bajo normativa MAAGTIC-SI - Ley Federal de Transparencia
                    </p>
                </div>
            </div>

            {/* Right Section - Login Form */}
            <div className="w-full md:w-[450px] lg:w-[550px] flex items-center justify-center p-6 z-10">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[420px] p-8 md:p-10 relative overflow-hidden">
                    <div className="mb-6 flex justify-center">
                        <img src="/IMSS_Logosímbolo.png" alt="Logo IMSS" className="h-16 object-contain" />
                    </div>

                    <h3 className="text-2xl font-bold text-slate-800 mb-1">Iniciar Sesión</h3>
                    <p className="text-sm text-slate-500 mb-8">Accede con tus credenciales institucionales IMSS</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-6 flex items-start gap-2">
                            <span className="font-semibold text-red-700">Error:</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 tracking-wider">MATRÍCULA</label>
                            <div className="relative flex items-center group">
                                <User className="absolute left-4 text-slate-400 group-focus-within:text-[#075940] transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    placeholder="Ej. ABC12345"
                                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-[#075940]/20 focus:border-[#075940] block p-3.5 pl-11 transition-all outline-none placeholder:text-slate-400 font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 tracking-wider">CONTRASEÑA</label>
                            <div className="relative flex items-center group">
                                <Lock className="absolute left-4 text-slate-400 group-focus-within:text-[#075940] transition-colors" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-[#075940]/20 focus:border-[#075940] block p-3.5 pl-11 pr-11 transition-all outline-none placeholder:text-slate-400 font-medium"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#629783] hover:bg-[#52806f] text-white font-semibold rounded-xl p-3.5 flex items-center justify-center gap-2 transition-all shadow-md shadow-[#629783]/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    <span>Ingresar al Sistema</span>
                                </>
                            )}
                        </button>

                        <div className="flex items-center justify-center gap-1.5 mt-8 text-[10px] text-slate-400 font-medium tracking-wide">
                            <CheckCircle2 size={12} className="text-slate-300" />
                            <span>Conexión cifrada • JWT HS256 • Sesión de 8 horas</span>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Bottom Footer */}
            <div className="absolute bottom-6 right-8 md:right-12 z-0 hidden md:block">
                <p className="text-[10px] text-green-100/50 font-medium tracking-wider">
                    © 2026 IMSS — DGSTI - v2.4.1 - Delegación Nayarit
                </p>
            </div>
        </div>
    );
};

export default Login;
