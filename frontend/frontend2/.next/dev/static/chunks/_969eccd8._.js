(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "api",
    ()=>api,
    "apiClient",
    ()=>apiClient,
    "apiRequest",
    ()=>apiRequest,
    "default",
    ()=>__TURBOPACK__default__export__,
    "tokenManager",
    ()=>tokenManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)");
;
// API Configuration
const API_BASE_URL = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
// Create Axios instance with default configuration
const createApiClient = ()=>{
    const client = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].create({
        baseURL: API_BASE_URL,
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json'
        }
    });
    // Request interceptor - Add auth token
    client.interceptors.request.use({
        "createApiClient.use": (config)=>{
            const token = localStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }
    }["createApiClient.use"], {
        "createApiClient.use": (error)=>{
            return Promise.reject(error);
        }
    }["createApiClient.use"]);
    // Response interceptor - Handle common errors
    client.interceptors.response.use({
        "createApiClient.use": (response)=>{
            return response;
        }
    }["createApiClient.use"], {
        "createApiClient.use": (error)=>{
            // Handle 401 Unauthorized — only redirect when a stored token has expired.
            // If there's no token, this is just a failed login attempt; let the error
            // propagate normally so the login page can display the error message.
            if (error.response?.status === 401) {
                const hasStoredToken = !!localStorage.getItem('auth_token');
                if (hasStoredToken) {
                    // Token expired — clear storage and return to the app root (no /login route)
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_data');
                    window.location.href = '/';
                }
            }
            // Handle network errors
            if (!error.response) {
                console.error('Network error:', error.message);
                return Promise.reject(new Error('Network connection failed. Please check your internet connection.'));
            }
            // Extract and forward server error message
            const message = error.response?.data?.message || 'An error occurred. Please try again.';
            return Promise.reject(new Error(message));
        }
    }["createApiClient.use"]);
    return client;
};
const apiClient = createApiClient();
const tokenManager = {
    setToken: (token)=>{
        localStorage.setItem('auth_token', token);
    },
    getToken: ()=>{
        return localStorage.getItem('auth_token');
    },
    removeToken: ()=>{
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
    },
    setUserData: (userData)=>{
        localStorage.setItem('user_data', JSON.stringify(userData));
    },
    getUserData: ()=>{
        const data = localStorage.getItem('user_data');
        return data ? JSON.parse(data) : null;
    }
};
const apiRequest = async (method, url, data, config)=>{
    try {
        const response = await apiClient.request({
            method,
            url,
            data,
            ...config
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};
const api = {
    get: (url, config)=>apiRequest('GET', url, undefined, config),
    post: (url, data, config)=>apiRequest('POST', url, data, config),
    put: (url, data, config)=>apiRequest('PUT', url, data, config),
    patch: (url, data, config)=>apiRequest('PATCH', url, data, config),
    delete: (url, config)=>apiRequest('DELETE', url, undefined, config)
};
const __TURBOPACK__default__export__ = api;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/auth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthService",
    ()=>AuthService,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api.ts [app-client] (ecmascript)");
;
class AuthService {
    // Unified login — uses a single /auth/login endpoint for both admin and surveyor
    // api.post<T> now returns T directly (no .data wrapper needed)
    static async login(credentials) {
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].post('/auth/login', credentials);
            // result = { token, user: { id, username, role, assignedVillages? }, message }
            const user = {
                id: result.user.id,
                username: result.user.username,
                role: result.user.role,
                assignedVillages: result.user.assignedVillages
            };
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tokenManager"].setToken(result.token);
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tokenManager"].setUserData(user);
            return {
                user,
                token: result.token
            };
        } catch (error) {
            throw new Error(error.message || 'Login failed. Please check your credentials.');
        }
    }
    // Admin-specific login (dedicated endpoint)
    static async adminLogin(credentials) {
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].post('/auth/admin-login', credentials);
            const user = {
                id: result.user.id,
                username: result.user.username,
                role: 'admin'
            };
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tokenManager"].setToken(result.token);
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tokenManager"].setUserData(user);
            return {
                user,
                token: result.token
            };
        } catch (error) {
            throw new Error(error.message || 'Admin login failed. Please check your credentials.');
        }
    }
    // Surveyor-specific login
    static async surveyorLogin(credentials) {
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].post('/auth/login', credentials);
            const user = {
                id: result.user.id,
                username: result.user.username,
                role: result.user.role,
                assignedVillages: result.user.assignedVillages
            };
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tokenManager"].setToken(result.token);
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tokenManager"].setUserData(user);
            return {
                user,
                token: result.token
            };
        } catch (error) {
            throw new Error(error.message || 'Surveyor login failed. Please check your credentials.');
        }
    }
    // Get current user profile
    // /auth/profile returns { user: { id, username, role, ... } } — unwrap the inner user object
    static async getProfile() {
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].get('/auth/profile');
            return result.user;
        } catch (error) {
            throw new Error(error.message || 'Failed to get user profile.');
        }
    }
    // Logout
    static logout() {
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tokenManager"].removeToken();
    }
    // Check if user is authenticated
    static isAuthenticated() {
        const token = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tokenManager"].getToken();
        const userData = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tokenManager"].getUserData();
        return !!(token && userData);
    }
    // Get current user from localStorage
    static getCurrentUser() {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tokenManager"].getUserData();
    }
    // Get current token
    static getCurrentToken() {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tokenManager"].getToken();
    }
    // Validate token by calling /auth/profile
    static async validateToken() {
        try {
            await this.getProfile();
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }
    // Setup initial admin (one-time setup)
    static async setupAdmin(username, password) {
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].post('/auth/setup-admin', {
                username,
                password
            });
        } catch (error) {
            throw new Error(error.message || 'Failed to setup admin account.');
        }
    }
}
const __TURBOPACK__default__export__ = AuthService;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/contexts/AuthContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "default",
    ()=>__TURBOPACK__default__export__,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
// Initial state
const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
};
// Auth reducer
const authReducer = (state, action)=>{
    switch(action.type){
        case 'LOGIN_START':
            return {
                ...state,
                isLoading: true,
                error: null
            };
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
                isLoading: false,
                error: null
            };
        case 'LOGIN_FAILURE':
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload
            };
        case 'LOGOUT':
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            };
        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null
            };
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload
            };
        default:
            return state;
    }
};
// Create context
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const AuthProvider = ({ children })=>{
    _s();
    const [state, dispatch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReducer"])(authReducer, initialState);
    // Initialize auth state on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            const initializeAuth = {
                "AuthProvider.useEffect.initializeAuth": async ()=>{
                    dispatch({
                        type: 'SET_LOADING',
                        payload: true
                    });
                    try {
                        if (__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthService"].isAuthenticated()) {
                            const user = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthService"].getCurrentUser();
                            const token = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthService"].getCurrentToken();
                            if (user && token) {
                                // Validate token with server
                                const isValid = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthService"].validateToken();
                                if (isValid) {
                                    dispatch({
                                        type: 'LOGIN_SUCCESS',
                                        payload: {
                                            user,
                                            token
                                        }
                                    });
                                } else {
                                    dispatch({
                                        type: 'LOGOUT'
                                    });
                                }
                            } else {
                                dispatch({
                                    type: 'LOGOUT'
                                });
                            }
                        } else {
                            dispatch({
                                type: 'LOGOUT'
                            });
                        }
                    } catch (error) {
                        console.error('Auth initialization error:', error);
                        dispatch({
                            type: 'LOGOUT'
                        });
                    } finally{
                        dispatch({
                            type: 'SET_LOADING',
                            payload: false
                        });
                    }
                }
            }["AuthProvider.useEffect.initializeAuth"];
            initializeAuth();
        }
    }["AuthProvider.useEffect"], []);
    // Login actions
    const login = async (credentials)=>{
        dispatch({
            type: 'LOGIN_START'
        });
        try {
            const { user, token } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthService"].login(credentials);
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                    user,
                    token
                }
            });
        } catch (error) {
            dispatch({
                type: 'LOGIN_FAILURE',
                payload: error.message || 'Login failed'
            });
            throw error;
        }
    };
    const adminLogin = async (credentials)=>{
        dispatch({
            type: 'LOGIN_START'
        });
        try {
            const { user, token } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthService"].adminLogin(credentials);
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                    user,
                    token
                }
            });
        } catch (error) {
            dispatch({
                type: 'LOGIN_FAILURE',
                payload: error.message || 'Admin login failed'
            });
            throw error;
        }
    };
    const surveyorLogin = async (credentials)=>{
        dispatch({
            type: 'LOGIN_START'
        });
        try {
            const { user, token } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthService"].surveyorLogin(credentials);
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                    user,
                    token
                }
            });
        } catch (error) {
            dispatch({
                type: 'LOGIN_FAILURE',
                payload: error.message || 'Surveyor login failed'
            });
            throw error;
        }
    };
    const logout = ()=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthService"].logout();
        dispatch({
            type: 'LOGOUT'
        });
    };
    const clearError = ()=>{
        dispatch({
            type: 'CLEAR_ERROR'
        });
    };
    const value = {
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        error: state.error,
        login,
        adminLogin,
        surveyorLogin,
        logout,
        clearError
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/contexts/AuthContext.tsx",
        lineNumber: 225,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(AuthProvider, "bgCdjuTOmPdSBRwTap80EFd9Y3U=");
_c = AuthProvider;
const useAuth = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
const __TURBOPACK__default__export__ = AuthContext;
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_969eccd8._.js.map