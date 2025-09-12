import React, { useState } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAppState } from '../../../contexts/AppStateContext';
import PaidDetectionPrompt from '../../features/PaidDetectionPrompt';
import styles from './Sidebar.module.css';

const ApiProvider = ({ type, icon, name, isActive, onClick, isCollapsed, isDisabled }) => {
  const { t } = useLanguage();
  
  return (
    <div
      className={`${styles.apiProvider} ${isActive ? styles.active : ''} ${isDisabled ? styles.disabled : ''}`}
      onClick={() => !isDisabled && onClick(type)}
      title={isCollapsed ? name : (isDisabled ? t('cannotSwitchWhileTesting') : '')}
      data-tooltip={name}
      style={{ cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.5 : 1 }}
    >
      <div className={styles.providerIcon}>{icon}</div>
      <span className={styles.providerName}>
        {name}
      </span>
    </div>
  );
};

const Sidebar = ({ isCollapsed }) => {
  const { t } = useLanguage();
  const { state, dispatch } = useAppState();
  const [showPaidDetectionPrompt, setShowPaidDetectionPrompt] = useState(false);

  const checkPaidDetectionPrompt = (apiType) => {
    if (apiType !== 'gemini') return false;

    const promptDisabled = localStorage.getItem('geminiPaidDetectionPromptDisabled') === 'true';
    if (promptDisabled) {
      const defaultSetting = localStorage.getItem('geminiPaidDetectionDefault') === 'true';
      dispatch({ type: 'SET_PAID_DETECTION', payload: defaultSetting });
      return false;
    }

    return true;
  };

  const handleApiTypeChange = (apiType) => {
    // 如果正在测试，阻止切换并给出提示
    if (state.isTesting) {
      alert(t('cannotSwitchWhileTesting'));
      return;
    }

    dispatch({ type: 'SET_API_TYPE', payload: apiType });
    dispatch({ type: 'CLEAR_DETECTED_MODELS' });

    if (checkPaidDetectionPrompt(apiType)) {
      setShowPaidDetectionPrompt(true);
    }
  };

  const apiProviders = [
    {
      type: 'openai',
      icon: (
        <svg fill="currentColor" fillRule="evenodd" height="14" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg" style={{ flex: '0 0 auto', lineHeight: 1 }}>
          <title>OpenAI</title>
          <path d="M21.55 10.004a5.416 5.416 0 00-.478-4.501c-1.217-2.09-3.662-3.166-6.05-2.66A5.59 5.59 0 0010.831 1C8.39.995 6.224 2.546 5.473 4.838A5.553 5.553 0 001.76 7.496a5.487 5.487 0 00.691 6.5 5.416 5.416 0 00.477 4.502c1.217 2.09 3.662 3.165 6.05 2.66A5.586 5.586 0 0013.168 23c2.443.006 4.61-1.546 5.361-3.84a5.553 5.553 0 003.715-2.66 5.488 5.488 0 00-.693-6.497v.001zm-8.381 11.558a4.199 4.199 0 01-2.675-.954c.034-.018.093-.05.132-.074l4.44-2.53a.71.71 0 00.364-.623v-6.176l1.877 1.069c.02.01.033.029.036.05v5.115c-.003 2.274-1.87 4.118-4.174 4.123zM4.192 17.78a4.059 4.059 0 01-.498-2.763c.032.02.09.055.131.078l4.44 2.53c.225.13.504.13.73 0l5.42-3.088v2.138a.068.068 0 01-.027.057L9.9 19.288c-1.999 1.136-4.552.46-5.707-1.51h-.001zM3.023 8.216A4.15 4.15 0 015.198 6.41l-.002.151v5.06a.711.711 0 00.364.624l5.42 3.087-1.876 1.07a.067.067 0 01-.063.005l-4.489-2.559c-1.995-1.14-2.679-3.658-1.53-5.63h.001zm15.417 3.54l-5.42-3.088L14.896 7.6a.067.067 0 01.063-.006l4.489 2.557c1.998 1.14 2.683 3.662 1.529 5.633a4.163 4.163 0 01-2.174 1.807V12.38a.71.71 0 00-.363-.623zm1.867-2.773a6.04 6.04 0 00-.132-.078l-4.44-2.53a.731.731 0 00-.729 0l-5.42 3.088V7.325a.068.068 0 01.027-.057L14.1 4.713c2-1.137 4.555-.46 5.707 1.513.487.833.664 1.809.499 2.757h.001zm-11.741 3.81l-1.877-1.068a.065.065 0 01-.036-.051V6.559c.001-2.277 1.873-4.122 4.181-4.12.976 0 1.92.338 2.671.954-.034.018-.092.05-.131.073l-4.44 2.53a.71.71 0 00-.365.623l-.003 6.173v.002zm1.02-2.168L12 9.25l2.414 1.375v2.75L12 14.75l-2.415-1.375v-2.75z"></path>
        </svg>
      ),
      name: 'OpenAI'
    },
    {
      type: 'gemini',
      icon: (
        <svg height="14" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg" style={{ flex: '0 0 auto', lineHeight: 1 }}>
          <title>Gemini</title>
          <defs>
            <linearGradient id="lobe-icons-gemini-fill" x1="0%" x2="68.73%" y1="100%" y2="30.395%">
              <stop offset="0%" stopColor="#1C7DFF"></stop>
              <stop offset="52.021%" stopColor="#1C69FF"></stop>
              <stop offset="100%" stopColor="#F0DCD6"></stop>
            </linearGradient>
          </defs>
          <path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12" fill="url(#lobe-icons-gemini-fill)" fillRule="nonzero"></path>
        </svg>
      ),
      name: 'Gemini'
    },
    {
      type: 'claude',
      icon: (
        <svg height="14" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg" style={{ flex: '0 0 auto', lineHeight: 1 }}>
          <title>Claude</title>
          <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill="#D97757" fillRule="nonzero"></path>
        </svg>
      ),
      name: 'Claude'
    },
    {
      type: 'deepseek',
      icon: (
        <svg height="14" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg" style={{ flex: '0 0 auto', lineHeight: 1 }}>
          <title>DeepSeek</title>
          <path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" fill="#4D6BFE"></path>
        </svg>
      ),
      name: 'DeepSeek'
    },
    {
      type: 'siliconcloud',
      icon: (
        <svg height="14" viewBox="0 0 22 23" width="14" xmlns="http://www.w3.org/2000/svg" style={{ flex: '0 0 auto', lineHeight: 1 }}>
          <title>SiliconCloud</title>
          <path clipRule="evenodd" d="M20.663 0h-1.741c-5.575 0-8.788 3.56-8.788 9.018v.937a7.161 7.161 0 105.043 5.451h5.486a2.623 2.623 0 100-5.246h-5.458V8.787c0-2.09 1.51-3.6 3.717-3.6h1.741a2.594 2.594 0 000-5.187zM10.29 16.839a2.13 2.13 0 10-4.258-.094 2.13 2.13 0 004.258.094z" fill="#7C3AED" fillRule="evenodd"></path>
        </svg>
      ),
      name: 'SiliconCloud'
    },
    {
      type: 'xai',
      icon: (
        <svg fill="currentColor" fillRule="evenodd" height="14" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg" style={{ flex: '0 0 auto', lineHeight: 1 }}>
          <title>xAI</title>
          <path d="M6.469 8.776L16.512 23h-4.464L2.005 8.776H6.47zm-.004 7.9l2.233 3.164L6.467 23H2l4.465-6.324zM22 2.582V23h-3.659V7.764L22 2.582zM22 1l-9.952 14.095-2.233-3.163L17.533 1H22z"></path>
        </svg>
      ),
      name: 'xAI'
    },
    {
      type: 'openrouter',
      icon: (
        <svg fill="currentColor" fillRule="evenodd" height="14" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg" style={{ flex: '0 0 auto', lineHeight: 1 }}>
          <title>OpenRouter</title>
          <path d="M16.804 1.957l7.22 4.105v.087L16.73 10.21l.017-2.117-.821-.03c-1.059-.028-1.611.002-2.268.11-1.064.175-2.038.577-3.147 1.352L8.345 11.03c-.284.195-.495.336-.68.455l-.515.322-.397.234.385.23.53.338c.476.314 1.17.796 2.701 1.866 1.11.775 2.083 1.177 3.147 1.352l.3.045c.694.091 1.375.094 2.825.033l.022-2.159 7.22 4.105v.087L16.589 22l.014-1.862-.635.022c-1.386.042-2.137.002-3.138-.162-1.694-.28-3.26-.926-4.881-2.059l-2.158-1.5a21.997 21.997 0 00-.755-.498l-.467-.28a55.927 55.927 0 00-.76-.43C2.908 14.73.563 14.116 0 14.116V9.888l.14.004c.564-.007 2.91-.622 3.809-1.124l1.016-.58.438-.274c.428-.28 1.072-.726 2.686-1.853 1.621-1.133 3.186-1.78 4.881-2.059 1.152-.19 1.974-.213 3.814-.138l.02-1.907z"></path>
        </svg>
      ),
      name: 'OpenRouter'
    },
  ];

  return (
    <>
      <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.providersSection}>
          {apiProviders.map((provider) => (
            <ApiProvider
              key={provider.type}
              type={provider.type}
              icon={provider.icon}
              name={provider.name}
              isActive={state.apiType === provider.type}
              onClick={handleApiTypeChange}
              isCollapsed={isCollapsed}
              isDisabled={state.isTesting && state.apiType !== provider.type}
            />
          ))}
        </div>
      </div>

      <PaidDetectionPrompt
        isOpen={showPaidDetectionPrompt}
        onClose={() => setShowPaidDetectionPrompt(false)}
        onConfirm={(enablePaidDetection) => {
          dispatch({ type: 'SET_PAID_DETECTION', payload: enablePaidDetection });
        }}
      />
    </>
  );
};

export default Sidebar;
