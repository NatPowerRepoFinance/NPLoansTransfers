import { createContext, useContext } from "react";

type ErpIframeContextValue = {
  erpIframe: boolean;
};

const ErpIframeContext = createContext<ErpIframeContextValue>({ erpIframe: false });

export const useErpIframe = (): ErpIframeContextValue => useContext(ErpIframeContext);

export default ErpIframeContext;
