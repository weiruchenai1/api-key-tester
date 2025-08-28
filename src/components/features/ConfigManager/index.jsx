import React, { useState } from 'react';
import { useUserConfig } from '../../../hooks/useLocalStorage';
import { useLanguage } from '../../../hooks/useLanguage';
import styles from './ConfigManager.module.css';

const ConfigManager = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { clearAllConfig, exportConfig, importConfig, recentProxyUrls } = useUserConfig();
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');

  const handleClearConfig = () => {
    if (window.confirm('确定要清除所有配置吗？这将重置所有设置并刷新页面。')) {
      clearAllConfig();
    }
  };

  const handleExportConfig = () => {
    try {
      exportConfig();
      setMessage('配置导出成功！');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('导出失败: ' + error.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleImportConfig = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      await importConfig(file);
      setMessage('配置导入成功！页面将在3秒后刷新。');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      setMessage('导入失败: ' + error);
    } finally {
      setImporting(false);
      event.target.value = ''; // 清除文件选择
    }
  };

  const handleRecentProxyClick = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      setMessage('代理URL已复制到剪贴板');
      setTimeout(() => setMessage(''), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>配置管理</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          {message && (
            <div className={`${styles.message} ${message.includes('失败') ? styles.error : styles.success}`}>
              {message}
            </div>
          )}

          <div className={styles.section}>
            <h4>配置备份与恢复</h4>
            <div className={styles.actions}>
              <button className={styles.btn} onClick={handleExportConfig}>
                📤 导出配置
              </button>
              <label className={styles.btn}>
                📥 导入配置
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportConfig}
                  disabled={importing}
                  style={{ display: 'none' }}
                />
              </label>
              {importing && <span className={styles.loading}>导入中...</span>}
            </div>
            <p className={styles.description}>
              导出配置将保存所有设置到JSON文件，导入配置可以从文件恢复设置。
            </p>
          </div>

          {recentProxyUrls.length > 0 && (
            <div className={styles.section}>
              <h4>最近使用的代理URL</h4>
              <div className={styles.proxyList}>
                {recentProxyUrls.map((url, index) => (
                  <div 
                    key={index} 
                    className={styles.proxyItem}
                    onClick={() => handleRecentProxyClick(url)}
                    title="点击复制到剪贴板"
                  >
                    <span className={styles.proxyUrl}>{url}</span>
                    <span className={styles.copyIcon}>📋</span>
                  </div>
                ))}
              </div>
              <p className={styles.description}>
                点击任意URL复制到剪贴板，最多保存10个最近使用的代理地址。
              </p>
            </div>
          )}

          <div className={styles.section}>
            <h4>重置设置</h4>
            <button className={styles.dangerBtn} onClick={handleClearConfig}>
              🗑️ 清除所有配置
            </button>
            <p className={styles.description}>
              这将清除所有保存的配置并恢复默认设置，操作不可撤销。
            </p>
          </div>

          <div className={styles.section}>
            <h4>本地存储信息</h4>
            <div className={styles.storageInfo}>
              <p>• 主题设置：{localStorage.getItem('theme') || '系统默认'}</p>
              <p>• 语言设置：{localStorage.getItem('language') || '中文'}</p>
              <p>• API类型：{localStorage.getItem('apiType') || 'OpenAI'}</p>
              <p>• 并发数：{localStorage.getItem('concurrency') || '3'}</p>
              <p>• 存储大小：约 {Math.round(JSON.stringify(localStorage).length / 1024)} KB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigManager;
