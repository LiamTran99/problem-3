import {Box, BoxProps} from "@chakra-ui/react";
import {useMemo} from "react"

import classes from './index.css'

// Define shape of wallet balance from API
interface WalletBalance {
    currency: string;
    amount: number;
}

// Extend with extra fields used in the UI
interface FormattedWalletBalance extends WalletBalance {
    formatted: string;
    usdValue: number;
    priority: number;
}

interface Props extends BoxProps {}

// Centralized blockchain constants for reusability, consistency, and type safety
const BLOCKCHAIN = {
    OSMOSIS: 'Osmosis',
    ETHEREUM: 'Ethereum',
    ARBITRUM: 'Arbitrum',
    ZILLIQA: 'Zilliqa',
    NEO: 'Neo',
} as const;

// Create a type from the values of BLOCKCHAIN to ensure only allowed names are used
type Blockchain = typeof BLOCKCHAIN[keyof typeof BLOCKCHAIN];

// Use a constant lookup map instead of `switch` to simplify and optimize priority logic
const BLOCKCHAIN_PRIORITIES: Record<Blockchain, number> = {
    [BLOCKCHAIN.OSMOSIS]: 100,
    [BLOCKCHAIN.ETHEREUM]: 50,
    [BLOCKCHAIN.ARBITRUM]: 30,
    [BLOCKCHAIN.ZILLIQA]: 20,
    [BLOCKCHAIN.NEO]: 20,
};

// Extract priority logic into a reusable function outside the component scope
// This prevents re-creating the function on every render and keeps logic isolated
const getPriority = (blockchain: string): number => {
    return BLOCKCHAIN_PRIORITIES[blockchain as Blockchain] ?? -99;
};

export default function WalletPage({ children, ...rest }: Props) {
    const balances: WalletBalance[] = useWalletBalances();  // Fetch wallet balances from API
    const prices = usePrices();  // Fetch token prices from API


    // Memoize computation to avoid re-running logic unless balances or prices change
    // All transformation (priority, formatting, usdValue) is done in one efficient pipeline
    const formattedBalances = useMemo<FormattedWalletBalance[]>(() => {
        return balances
            .map((balance) => ({
                ...balance,
                priority: getPriority(balance.currency),   // Compute priority once, cache for sort
                formatted: balance.amount.toFixed(2), // Pre-format display string to avoid doing this in render
                usdValue : (prices[balance.currency] ?? 0) * balance.amount, // Safe fallback for missing price
            }))
            .filter((balance) => balance.priority > -99 && balance.amount > 0)  // Only show valid & positive balances
            .sort((a, b) => b.priority - a.priority)  // Put higher-priority items at the top of the list
    }, [balances, prices]); // Recompute only when balances and prices changes

    return (
        <Box {...rest}>
            {/* Rendering using pre-processed data, no additional computation inside render */}
            {formattedBalances.map((balance) => (
                <WalletRow
                    className={classes.row}
                    key={balance.currency} // Use stable key instead of index to avoid rendering issues
                    amount={balance.amount}
                    usdValue={balance.usdValue}
                    formattedAmount={balance.formatted}
                />
            ))}
        </Box>
    );
}