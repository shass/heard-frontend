/**
 * BringID SDK Instance
 *
 * Singleton instance of the BringID SDK for identity verification.
 */

import { BringID } from 'bringid'

// Determine mode from environment
const mode = process.env.NEXT_PUBLIC_BRINGID_MODE === 'dev' ? 'dev' : 'production'

export const bringid = new BringID({ mode })
