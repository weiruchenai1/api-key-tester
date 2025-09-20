import React, { createContext, useReducer, useContext, useEffect, useRef, useMemo } from 'react';
import { debounce } from '../utils/debounce';
import { getAllLogEntries } from '../utils/logStorage';

// 清理旧的localStorage数据
const cleanupOldData = () => {
  try {
    // 直接删除旧的键，不进行迁移
    // 这样可以确保使用正确的默认模型
    if (localStorage.getItem('testModel')) {
      localStorage.removeItem('testModel');
    }
    if (localStorage.getItem('proxyUrl')) {
      localStorage.removeItem('proxyUrl');
    }
  } catch (error) {
    console.warn('清理旧数据失败:', error);
  }
};

// 获取特定API类型的完整状态
const getApiTypeState = (apiType) => {
  try {
    const key = `apiState_${apiType}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {
      model: getDefaultModelForApiType(apiType),
      proxyUrl: '',
      apiKeysText: '',
      keyResults: [],
      showResults: false,
      activeTab: 'all'
    };
  } catch (error) {
    return {
      model: getDefaultModelForApiType(apiType),
      proxyUrl: '',
      apiKeysText: '',
      keyResults: [],
      showResults: false,
      activeTab: 'all'
    };
  }
};

// 保存特定API类型的状态
const saveApiTypeState = (apiType, state) => {
  try {
    const key = `apiState_${apiType}`;
    const stateToSave = {
      model: state.model,
      proxyUrl: state.proxyUrl,
      apiKeysText: state.apiKeysText || '',
      keyResults: state.keyResults || [],
      showResults: state.showResults || false,
      activeTab: state.activeTab || 'all'
    };
    localStorage.setItem(key, JSON.stringify(stateToSave));
  } catch (error) {
    console.warn('保存API状态失败:', error);
  }
};

// 获取默认模型
const getDefaultModelForApiType = (apiType) => {
  const defaultModels = {
    openai: 'gpt-4o-mini',
    claude: 'claude-3-5-sonnet-20241022',
    gemini: 'gemini-2.0-flash',
    deepseek: 'deepseek-chat',
    siliconcloud: 'deepseek-ai/DeepSeek-V3',
    xai: 'grok-2-1212',
    openrouter: 'deepseek/deepseek-chat-v3.1:free'
  };
  return defaultModels[apiType] || '';
};

// 获取本地存储的初始状态
const getInitialState = () => {
  try {
    // 清理旧数据
    cleanupOldData();
    
    const apiType = localStorage.getItem('apiType') ? JSON.parse(localStorage.getItem('apiType')) : 'openai';
    const currentApiState = getApiTypeState(apiType);
    
    return {
      // 当前选中的API类型
      apiType,
      
      // 当前API类型的状态
      model: currentApiState.model,
      proxyUrl: currentApiState.proxyUrl,
      apiKeysText: currentApiState.apiKeysText,
      keyResults: currentApiState.keyResults,
      showResults: currentApiState.showResults,
      activeTab: currentApiState.activeTab,

      // 全局设置 - 从localStorage获取
      concurrency: localStorage.getItem('concurrency') ? JSON.parse(localStorage.getItem('concurrency')) : 5,
      retryCount: localStorage.getItem('maxRetries') ? JSON.parse(localStorage.getItem('maxRetries')) : 3,
      logs: [],
      activeLogKey: null,
      isLogModalOpen: false,

      // Gemini付费检测 - 从localStorage获取
      enablePaidDetection: localStorage.getItem('enablePaidDetection') ? JSON.parse(localStorage.getItem('enablePaidDetection')) : false,

      // 测试状态
      isTesting: false,
      detectedModels: new Set(),

      // 消息
      message: null
    };
  } catch (error) {
    console.warn('读取本地存储失败，使用默认配置:', error);
    return {
      apiType: 'openai',
      model: 'gpt-4o-mini',
      proxyUrl: '',
      apiKeysText: '',
      concurrency: 5,
      retryCount: 3,
      logs: [],
      activeLogKey: null,
      isLogModalOpen: false,
      enablePaidDetection: false,
      isTesting: false,
      keyResults: [],
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
      // 先保存当前API类型的状态
      saveApiTypeState(state.apiType, state);
      
      // 加载新API类型的状态
      const newApiState = getApiTypeState(action.payload);
      
      return {
        ...state,
        apiType: action.payload,
        model: newApiState.model,
        proxyUrl: newApiState.proxyUrl,
        apiKeysText: newApiState.apiKeysText,
        keyResults: newApiState.keyResults,
        showResults: newApiState.showResults,
        activeTab: newApiState.activeTab
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
        model: getDefaultModelForApiType(state.apiType),
        proxyUrl: state.proxyUrl,
        concurrency: state.concurrency,
        retryCount: state.retryCount,
        enablePaidDetection: state.enablePaidDetection,
        logs: [],
        activeLogKey: null,
        isLogModalOpen: false,
        // 清空测试相关的数据
        apiKeysText: '', // 清空密钥列表
        keyResults: [],
        showResults: false,
        activeTab: 'all'
      };

    // 日志相关
    case 'SET_LOGS':
      return {
        ...state,
        logs: Array.isArray(action.payload) ? action.payload : []
      };

    case 'ADD_LOG': {
      const newLogs = [
        ...(state.logs || []),
        action.payload
      ];
      return {
        ...state,
        logs: newLogs
      };
    }
    case 'UPDATE_LOG': {
      const { id, ...rest } = action.payload || {};
      if (!id) return state;
      return {
        ...state,
        logs: (state.logs || []).map(l => l.id === id ? { ...l, ...rest } : l)
      };
    }
    case 'CLEAR_LOGS':
      return {
        ...state,
        logs: [],
        activeLogKey: null,
        isLogModalOpen: false
      };

    case 'OPEN_LOG_MODAL':
      return {
        ...state,
        activeLogKey: action.payload,
        isLogModalOpen: true
      };

    case 'CLOSE_LOG_MODAL':
      return {
        ...state,
        activeLogKey: null,
        isLogModalOpen: false
      };

    default:
      return state;
  }
};


// Context
const AppStateContext = createContext();

// Provider组件
export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, getInitialState());
  const stateRef = useRef(state);
  // 日志收集器
  const logCollectorRef = useRef(null);
  const hasHydratedLogsRef = useRef(false);

  // 保持stateRef同步
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let isMounted = true;

    getAllLogEntries()
      .then((storedLogs) => {
        if (!isMounted) return;
        if (Array.isArray(storedLogs) && storedLogs.length > 0) {
          dispatch({ type: 'SET_LOGS', payload: storedLogs });
        }
      })
      .catch((error) => {
        console.warn('加载持久化日志失败:', error);
      });

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  // 使用useMemo创建稳定的防抖函数
  const debouncedSaveApiState = useMemo(
    () => debounce((apiType, stateToSave) => {
      try {
        saveApiTypeState(apiType, stateToSave);
      } catch (error) {
        console.warn('保存API状态失败:', error);
      }
    }, 300),
    [] // 空依赖数组，因为saveApiTypeState是稳定的外部函数
  );

  // 监听全局配置变化并保存到localStorage（这些变化不频繁，可以立即保存）
  useEffect(() => {
    try {
      localStorage.setItem('apiType', JSON.stringify(state.apiType));
      localStorage.setItem('concurrency', JSON.stringify(state.concurrency));
      localStorage.setItem('maxRetries', JSON.stringify(state.retryCount));
      localStorage.setItem('enablePaidDetection', JSON.stringify(state.enablePaidDetection));
    } catch (error) {
      console.warn('保存全局配置到本地存储失败:', error);
    }
  }, [state.apiType, state.concurrency, state.retryCount, state.enablePaidDetection]);

  // 监听API状态变化并防抖保存（避免频繁保存，如输入时的每个字符变化）
  useEffect(() => {
    // 只在非初始渲染时保存，避免初始化时的无效保存
    const shouldSave = state.apiType && (
      state.model || 
      state.proxyUrl || 
      state.apiKeysText || 
      state.keyResults.length > 0
    );
    
    if (shouldSave) {
      debouncedSaveApiState(state.apiType, state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.apiType, 
    state.model, 
    state.proxyUrl, 
    state.apiKeysText, 
    state.keyResults, 
    state.showResults, 
    state.activeTab,
    debouncedSaveApiState
  ]);

  useEffect(() => {
    const collector = logCollectorRef.current;
    if (!collector) return;

    if (!state.logs || state.logs.length === 0) {
      if (typeof collector.clearCache === 'function') {
        collector.clearCache();
      }
      hasHydratedLogsRef.current = false;
      return;
    }

    if (hasHydratedLogsRef.current) return;

    if (typeof collector.hydrateLogs === 'function') {
      collector.hydrateLogs(state.logs);
      hasHydratedLogsRef.current = true;
    }
  }, [state.logs]);

  // 组件卸载时立即保存任何待保存的数据
  useEffect(() => {
    return () => {
      try {
        const currentState = stateRef.current;
        saveApiTypeState(currentState.apiType, currentState);
      } catch (error) {
        console.warn('组件卸载时保存状态失败:', error);
      }
    };
  }, []); // 空依赖数组，只在组件挂载时设置cleanup

  // 初始化日志收集器
  useEffect(() => {
    import('../utils/logCollector')
      .then(({ initializeLogCollector, getLogCollector }) => {
        if (!logCollectorRef.current) {
          logCollectorRef.current = initializeLogCollector(dispatch);
        }
        const collector = getLogCollector();
        if (collector) {
          if (typeof collector.setEnabled === 'function') {
            collector.setEnabled(true);
          }
          if (typeof collector.hydrateLogs === 'function' && (stateRef.current.logs || []).length > 0) {
            collector.hydrateLogs(stateRef.current.logs || []);
            hasHydratedLogsRef.current = true;
          }
        }
      })
      .catch(() => {
        // 安静失败，不影响主要功能
      });
  }, [dispatch]);

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
