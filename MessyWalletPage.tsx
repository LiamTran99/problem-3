interface WalletBalance {
    currency: string;
    amount: number;
}

// if using interface, FormattedWalletBalance can extend from WalletBalance, so we can just need add new formatted property
interface FormattedWalletBalance {
    currency: string;
    amount: number;
    formatted: string;
}

interface Props extends BoxProps {

}
const WalletPage: React.FC<Props> = (props: Props) => {
    const { children, ...rest } = props;
    const balances = useWalletBalances();
    const prices = usePrices();

    // Anti-pattern: Declaring `getPriority` inside the component causes it to be re-created on every render
    // Refactor: Move `getPriority` outside the component and define a constant-based priority map
    // Type safety issue: using `any` as the type for blockchain
    // Maintainability issue: hardcoded case is not scalable or extendable
    const getPriority = (blockchain: any): number => {
        switch (blockchain) {
            case 'Osmosis':
                return 100
            case 'Ethereum':
                return 50
            case 'Arbitrum':
                return 30
            case 'Zilliqa':
                return 20
            case 'Neo':
                return 20
            default:
                return -99
        }
    }

    // duplicate call getPriority so many times

    const sortedBalances = useMemo(() => {
        return balances.filter((balance: WalletBalance) => {
            //  balance.blockchain does not exist (WalletBalance has currency, not blockchain)
            // Inefficient: `getPriority` is called multiple times unnecessarily during both filter and sort
            const balancePriority = getPriority(balance.blockchain);

            //  lhsPriority is an undefined variable; should use balancePriority
            if (lhsPriority > -99) {
                // Filtering logic is unclear or wrong, Why only show balances with amount <= 0
                // positive amount should be displayed, so we can remove
                if (balance.amount <= 0) {
                    return true; // Logic is backwards — this keeps balances with no money
                }
            }
            return false
        }).sort((lhs: WalletBalance, rhs: WalletBalance) => {
            // blockchain is not exist in WalletBalance, it should be currency
            // call getPriority so many times during .sort()
            const leftPriority = getPriority(lhs.blockchain);
            const rightPriority = getPriority(rhs.blockchain);
            if (leftPriority > rightPriority) {
                return -1;
            } else if (rightPriority > leftPriority) {
                return 1;
            }
        });
    }, [balances, prices]); // prices is in the dependency array but not used — unnecessary re-computation

    // Unused: formattedBalances is never used in rendering
    //  Better to integrate formatting into the sorted list or use one consolidated transformation step
    const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
        return {
            ...balance,
            formatted: balance.amount.toFixed()
        }
    })

    // Inefficient: rows is recalculated on every render instead of being memoized
    // Uses sortedBalances, which lacks the formatted field; should use formattedBalances
    const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
        // prices[balance.currency] can be undefined, we should add fallback value
        const usdValue = prices[balance.currency] * balance.amount;
        return (
            <WalletRow
                className={classes.row}
                key={index}  // Wrong when Using index as key in .map(), Better to use a stable unique key like balance.currency
                amount={balance.amount}
                usdValue={usdValue}
                formattedAmount={balance.formatted}
            />
        )
    })

    return (
        <div {...rest}>
            {rows}
        </div>
    )
}