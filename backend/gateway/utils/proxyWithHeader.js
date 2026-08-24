import proxy from "express-http-proxy";

export const proxyWithHeader = (secureUrl) => {
  return proxy(secureUrl, {
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      if (srcReq.user) {
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
      }
    },
  });
};
