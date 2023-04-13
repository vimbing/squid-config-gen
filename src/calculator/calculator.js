import { getIPRange } from 'get-ip-range';

export function getIps(subnet) {
    const ipRange = getIPRange(subnet);

    ipRange.shift();
    ipRange.pop();

    return ipRange.map(ip => `${ip}`);
}