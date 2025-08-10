export const useNavigate = vi.fn(() => vi.fn())
export const Link = ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
export const useLocation = vi.fn(() => ({ pathname: '/' }))