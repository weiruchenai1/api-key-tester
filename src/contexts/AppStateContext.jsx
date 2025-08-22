import React, { createContext, useReducer, useContext } from 'react';

// 初始状态
const initialState = {
  // API配置
  apiType: 'openai',
  model: 'gpt-4o',
  proxyUrl: '',

  // 输入
  apiKeysText: '',

  // 并发和重试
  concurrency: 5,
  retryCount: 3,

  // Gemini付费检测
  enablePaidDetection: false,

  // 测试状态
  isTesting: false,
  keyResults: [],
  progress: 0,

  // UI状态
  showResults: false,
  activeTab: 'all',
  detectedModels: new Set(),

  // 消息
  message: null
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_API_TYPE':
      return {
        ...state,
        apiType: action.payload,
        // 重置模型选择
        model: getDefaultModel(action.payload)
      };

    case 'SET_MODEL':
      return {
        ...state,
        model: action.payload
      };

    case 'SET_PROXY_URL':
      return {
        ...state,
        proxyUrl: action.payload
      };

    case 'SET_API_KEYS_TEXT':
      return {
        ...state,
        apiKeysText: action.payload
      };

    case 'SET_CONCURRENCY':
      return {
        ...state,
        concurrency: action.payload
      };

    case 'SET_RETRY_COUNT':
      return {
        ...state,
        retryCount: action.payload
      };

    case 'SET_PAID_DETECTION':
      return {
        ...state,
        enablePaidDetection: action.payload
      };

    case 'START_TESTING':
      return {
        ...state,
        isTesting: true,
        showResults: true,
        keyResults: action.payload.keys.map(key => ({
          key,
          status: 'pending',
          error: null,
          retryCount: 0,
          model: state.model,
          isPaid: null // For Gemini paid detection
        })),
        progress: 0,
        activeTab: 'all'
      };

    case 'UPDATE_KEY_STATUS':
      return {
        ...state,
        keyResults: state.keyResults.map(keyResult =>
          keyResult.key === action.payload.key
            ? { ...keyResult, ...action.payload }
            : keyResult
        )
      };

    case 'TESTING_COMPLETE':
      return {
        ...state,
        isTesting: false
      };

    case 'CANCEL_TESTING':
      return {
        ...state,
        isTesting: false
      };

    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload
      };

    case 'SET_DETECTED_MODELS':
      return {
        ...state,
        detectedModels: new Set(action.payload)
      };

    case 'CLEAR_DETECTED_MODELS':
      return {
        ...state,
        detectedModels: new Set()
      };

    case 'SHOW_MESSAGE':
      return {
        ...state,
        message: action.payload
      };

    case 'CLEAR_MESSAGE':
      return {
        ...state,
        message: null
      };

    case 'CLEAR_ALL':
      return {
        ...initialState,
        apiType: state.apiType,
        model: getDefaultModel(state.apiType),
        proxyUrl: state.proxyUrl,
        concurrency: state.concurrency,
        retryCount: state.retryCount,
        enablePaidDetection: state.enablePaidDetection
      };

    default:
      return state;
  }
};

// 获取默认模型
const getDefaultModel = (apiType) => {
  const defaultModels = {
    openai: 'gpt-4o',
    claude: 'claude-3-5-sonnet-20241022',
    gemini: 'gemini-2.0-flash'
  };
  return defaultModels[apiType] || '';
};

// Context
const AppStateContext = createContext();

// Provider组件
export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const value = {
    state,
    dispatch
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

// Hook
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
