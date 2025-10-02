import React from "react";
import toast from "react-hot-toast";

// 基础提示函数
export const showToast = {
  success: (message) => {
    toast.success(message);
  },
  
  error: (message) => {
    toast.error(message);
  },
  
  info: (message) => {
    toast(message, {
      icon: "ℹ️",
      style: {
        background: "var(--bg-card)",
        color: "var(--text-primary)",
        border: "1px solid var(--border-color)",
        borderLeftColor: "var(--color-info)",
        borderLeftWidth: "4px",
      },
      ariaProps: {
        role: "status",
        "aria-live": "polite",
        "aria-label": `信息通知: ${message}`
      },
    });
  },
  
  warning: (message) => {
    toast(message, {
      icon: "⚠️",
      style: {
        background: "var(--bg-card)",
        color: "var(--text-primary)", 
        border: "1px solid var(--border-color)",
        borderLeftColor: "var(--color-warning)",
        borderLeftWidth: "4px",
      },
      ariaProps: {
        role: "alert",
        "aria-live": "assertive",
        "aria-label": `警告通知: ${message}`
      },
    });
  },
  
  loading: (message) => {
    return toast.loading(message);
  },
  
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },
};

// 确认对话框函数
export const showConfirm = (message, options = {}) => {
  return new Promise((resolve) => {
    const {
      confirmText = "确定",
      cancelText = "取消",
      confirmStyle = "danger", // "danger" | "primary"
    } = options;

    toast(
      (t) => (
        <div 
          style={{ minWidth: "250px" }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              toast.dismiss(t.id);
              resolve(false);
            } else if (e.key === 'Enter') {
              toast.dismiss(t.id);
              resolve(true);
            }
          }}
          tabIndex={-1}
          autoFocus
        >
          <div style={{ 
            marginBottom: "12px", 
            fontSize: "var(--font-size-sm)",
            color: "var(--text-primary)",
          }}>
            {message}
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              style={{
                padding: "6px 12px",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--border-radius)",
                cursor: "pointer",
                fontSize: "var(--font-size-xs)",
                transition: "var(--transition-fast)",
                outline: "none",
              }}
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "var(--bg-tertiary)";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "var(--bg-input)";
              }}
              onFocus={(e) => {
                e.target.style.outline = "2px solid var(--color-primary)";
                e.target.style.outlineOffset = "2px";
              }}
              onBlur={(e) => {
                e.target.style.outline = "none";
              }}
            >
              {cancelText}
            </button>
            <button
              style={{
                padding: "6px 12px",
                backgroundColor: confirmStyle === "danger" ? "var(--color-danger)" : "var(--color-primary)",
                color: "white",
                border: "none",
                borderRadius: "var(--border-radius)",
                cursor: "pointer",
                fontSize: "var(--font-size-xs)",
                transition: "var(--transition-fast)",
                outline: "none",
              }}
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              onFocus={(e) => {
                e.target.style.outline = "2px solid white";
                e.target.style.outlineOffset = "2px";
              }}
              onBlur={(e) => {
                e.target.style.outline = "none";
              }}
              autoFocus
            >
              {confirmText}
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--border-radius)",
          padding: "16px",
          boxShadow: "var(--shadow-sm)",
        },
        ariaProps: {
          role: "alertdialog",
          "aria-modal": "true",
          "aria-label": "确认对话框"
        },
      }
    );
  });
};

// 替换 alert 的函数
/**
 * 显示信息提示 - 非阻塞式，与原生 alert() 不同
 * @param {string} message - 要显示的消息
 */
export const showAlert = (message) => {
  showToast.info(message);
};

// 替换 confirm 的函数
/**
 * 显示确认对话框 - 返回 Promise，与原生 confirm() 不同
 * @param {string} message - 要显示的消息
 * @returns {Promise<boolean>} 用户选择结果的 Promise
 */
export const showConfirmDialog = (message) => {
  return showConfirm(message);
};