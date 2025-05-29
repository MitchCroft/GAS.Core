namespace MC.GAS.StringComparison {
    /**
     * Use the Levenshtein Distance algorithm to determine string distance values
     */
    export class LevenshteinDistance implements IStringComparison {
        /*----------Functions----------*/
        //PUBLIC

        /**
         * Calculate the number of changes that need to be made to convert the target to the source
         * @param source The source string that is used for the calculations
         * @param target The target string that is used for the calculations
         * @returns Returns the number of character changes needed to have two identical strings
         */
        public calculateDistance(source: string, target: string): number {
            if (source === target) {
                return 0;
            }
            var n = source.length, m = target.length;
            if (n === 0 || m === 0) {
                return n + m;
            }
            var x = 0, y, a, b, c, d, g, h, k;
            var p = new Array(n);
            for (y = 0; y < n;) {
                p[y] = ++y;
            }
        
            for (; (x + 3) < m; x += 4) {
                var e1 = target.charCodeAt(x);
                var e2 = target.charCodeAt(x + 1);
                var e3 = target.charCodeAt(x + 2);
                var e4 = target.charCodeAt(x + 3);
                c = x;
                b = x + 1;
                d = x + 2;
                g = x + 3;
                h = x + 4;
                for (y = 0; y < n; y++) {
                    k = source.charCodeAt(y);
                    a = p[y];
                    if (a < c || b < c) {
                        c = (a > b ? b + 1 : a + 1);
                    }
                    else {
                        if (e1 !== k) {
                            c++;
                        }
                    }
        
                    if (c < b || d < b) {
                        b = (c > d ? d + 1 : c + 1);
                    }
                    else {
                        if (e2 !== k) {
                            b++;
                        }
                    }
        
                    if (b < d || g < d) {
                        d = (b > g ? g + 1 : b + 1);
                    }
                    else {
                        if (e3 !== k) {
                            d++;
                        }
                    }
        
                    if (d < g || h < g) {
                        g = (d > h ? h + 1 : d + 1);
                    }
                    else {
                        if (e4 !== k) {
                            g++;
                        }
                    }
                    p[y] = h = g;
                    g = d;
                    d = b;
                    b = c;
                    c = a;
                }
            }
        
            for (; x < m;) {
                var e = target.charCodeAt(x);
                c = x;
                d = ++x;
                for (y = 0; y < n; y++) {
                    a = p[y];
                    if (a < c || d < c) {
                        d = (a > d ? d + 1 : a + 1);
                    }
                    else {
                        if (e !== source.charCodeAt(y)) {
                            d = c + 1;
                        }
                        else {
                            d = c;
                        }
                    }
                    p[y] = d;
                    c = a;
                }
                h = d;
            }
        
            return h;
        }
    }
}
