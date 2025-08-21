export const ROLES = {
  LEARNER: "learner",
  EDUCATOR: "educator"
};

export const SUBSCRIPTION_TIERS = {
  PLUS: "Plus",
  ICONIC: "Iconic"
};

export const JSON_OK = (data = {}, meta = {}) => ({ success: true, ...data, ...(Object.keys(meta).length ? { meta } : {}) });
export const JSON_ERR = (message, code = "ERROR", details = null) => ({ success: false, code, message, ...(details ? { details } : {}) });
