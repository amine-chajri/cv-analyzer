import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b border-slate-900/50 bg-slate-900 h-14"
      >
        <div className="mx-auto max-w-6xl flex h-full items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-slate-100">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
              CV
            </span>
            <span>
              CV<span className="text-primary">Lens</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2 hidden sm:flex">
            {user ? (
              <>
                <NavLink
                  to="/"
                  className={isActive =>
                    isActive ? 'rounded-lg px-3 py-2 text-sm font-medium text-slate-100 bg-slate-800' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/history"
                  className={isActive =>
                    isActive ? 'rounded-lg px-3 py-2 text-sm font-medium text-slate-100 bg-slate-800' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'
                  }
                >
                  History
                </NavLink>
                <NavLink
                  to="/templates"
                  className={isActive =>
                    isActive ? 'rounded-lg px-3 py-2 text-sm font-medium text-slate-100 bg-slate-800' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'
                  }
                >
                  Templates
                </NavLink>
                {user.role === 'admin' && (
                  <NavLink
                    to="/admin"
                    className={isActive =>
                      isActive ? 'rounded-lg px-3 py-2 text-sm font-semibold text-amber-400 bg-amber-800' : 'text-amber-400 hover:bg-amber-700'
                    }
                  >
                    🛡️ Admin
                  </NavLink>
                )}
                <div className="mx-2 hidden items-center gap-2 sm:flex">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-600 text-xs font-semibold text-slate-200">
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[140px] truncate text-sm font-medium text-slate-200">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={isActive =>
                    isActive ? 'rounded-lg px-3 py-2 text-sm font-medium text-primary bg-primary' : 'text-slate-400 hover:bg-slate-200'
                  }
                >
                  Log in
                </NavLink>
                <Link
                  to="/register"
                  className="rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <NavLink
              to="/"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-600 text-xs font-semibold text-slate-200"
              aria-label="Home"
            >
              🏠
            </NavLink>
          </div>
        </div>
      </header>

      <header
        className="sticky top-14 z-40 bg-canvas-parchment/80 backdrop-filter blur-md border-b border-hairline"
      >
        <div className="mx-auto max-w-6xl flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">CV Lens</span>
          </div>
          <div className="flex items-center gap-2">
            <NavLink
              to="/"
              className={isActive =>
                isActive ? 'rounded-sm px-3 py-2 text-button-utility bg-primary text-on-primary' : 'text-primary hover:bg-primary/10'
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/history"
              className={isActive =>
                isActive ? 'rounded-sm px-3 py-2 text-button-utility bg-primary text-on-primary' : 'text-primary hover:bg-primary/10'
              }
            >
              History
            </NavLink>
            <NavLink
              to="/templates"
              className={isActive =>
                isActive ? 'rounded-sm px-3 py-2 text-button-utility bg-primary text-on-primary' : 'text-primary hover:bg-primary/10'
              }
            >
              Templates
            </NavLink>
          </div>
          <button className="button-primary rounded-pill py-2.5 px-8 typography-body strong">
            Buy
          </button>
        </div>
      </header>
    </>
  );
}