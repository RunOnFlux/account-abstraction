import deployments from "./deployments.json"

export interface Deployments {
    VerifyingPaymaster?: string
    SharedAccountFactory?: string
    MultiOwnerSmartAccountFactory?: string

}

export function getDeployments(chainId: 80001 | 11155111) {
    return (deployments as { [key in 80001 | 11155111]: Deployments })[chainId]
}
