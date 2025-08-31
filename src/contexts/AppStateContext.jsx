import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { useUserConfig } from '../hooks/useLocalStorage';

// 获取本地存储的初始状态
const getInitialState = () => {
  try {
    return {
      // API配置 - 从localStorage获取
      apiType: localStorage.getItem('apiType') ? JSON.parse(localStorage.getItem('apiType')) : 'openai',
      model: localStorage.getItem('testModel') ? JSON.parse(localStorage.getItem('testModel')) : 'gpt-4o',
      proxyUrl: localStorage.getItem('proxyUrl') ? JSON.parse(localStorage.getItem('proxyUrl')) : '',

      // 输入
      apiKeysText: '',

      // 并发和重试 - 从localStorage获取
      concurrency: localStorage.getItem('concurrency') ? JSON.parse(localStorage.getItem('concurrency')) : 5,
      retryCount: localStorage.getItem('maxRetries') ? JSON.parse(localStorage.getItem('maxRetries')) : 3,

      // Gemini付费检测 - 从localStorage获取
      enablePaidDetection: localStorage.getItem('enablePaidDetection') ? JSON.parse(localStorage.getItem('enablePaidDetection')) : false,

      // 测试状态
      isTesting: false,
      keyResults: [],
      // progress: 0,  // 删除这行

      // UI状态
      showResults: false,
      activeTab: 'all',
      detectedModels: new Set(),

      // 消息
      message: null
    };
  } catch (error) {
    console.warn('读取本地存储失败，使用默认配置:', error);
    return {
      apiType: 'openai',
      model: 'gpt-4o',
      proxyUrl: '',
      apiKeysText: '',
      concurrency: 5,
      retryCount: 3,
      enablePaidDetection: false,
      isTesting: false,
      keyResults: [],
      // progress: 0,  // 删除这行
      showResults: false,
      activeTab: 'all',
      detectedModels: new Set(),
      message: null
    };
  }
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
        enablePaidDetection: action.payload,
        // 当启用付费检测时，自动切换到gemini-2.5-flash
        model: action.payload ? 'gemini-2.5-flash' : state.model
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
        // progress: 0,  // 删除这行
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
        ...getInitialState(),
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
  const [state, dispatch] = useReducer(appReducer, getInitialState());

  // 监听状态变化并保存到localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apiType', JSON.stringify(state.apiType));
      localStorage.setItem('testModel', JSON.stringify(state.model));
      localStorage.setItem('proxyUrl', JSON.stringify(state.proxyUrl));
      localStorage.setItem('concurrency', JSON.stringify(state.concurrency));
      localStorage.setItem('maxRetries', JSON.stringify(state.retryCount));
      localStorage.setItem('enablePaidDetection', JSON.stringify(state.enablePaidDetection));
    } catch (error) {
      console.warn('保存配置到本地存储失败:', error);
    }
  }, [state.apiType, state.model, state.proxyUrl, state.concurrency, state.retryCount, state.enablePaidDetection]);

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
