/**
 * BringID SDK Instance
 *
 * Singleton instance of the BringID SDK for identity verification.
 */

import { BringID } from 'bringid'
import { env } from '@/lib/env'

export const bringid = new BringID({ appId: env.BRINGID_APP_ID, mode: env.BRINGID_MODE })
