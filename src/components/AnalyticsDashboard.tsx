import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import './AnalyticsDashboard.css';

interface AnalyticsDashboardProps {
  stats: any;
  salons: any[];
}

const serviceData = [
  { name: 'Hair Styling', value: 58, color: '#A91B60' },
  { name: 'Nails & Spa', value: 24, color: '#7D6B74' },
  { name: 'Skin Care', value: 18, color: '#FCE8EF' },
];

export default function AnalyticsDashboard({ stats, salons }: AnalyticsDashboardProps) {
  // 1. Bar Chart Data: Platform Metrics
  const platformMetrics = [
    { name: 'Users', value: stats?.users?.total || 0 },
    { name: 'Salons', value: stats?.salons?.approved || 0 },
    { name: 'Appointments', value: stats?.appointments?.total || 0 }
  ];

  // 2. Pie Chart Data: Service Categories (Static Data as requested)

  // 3. Registrations Stacked Bars
  const clients = stats?.users?.clients || 0;
  const owners = stats?.users?.owners || 0;
  const totalUsers = clients + owners;
  const registrationsData = [
    { label: 'Total to Date', clients, owners, total: totalUsers }
  ];



  const revAmount = `GH₵ ${(stats?.financials?.totalRevenue || 0).toLocaleString()}`;

  return (
    <div className="analytics-dashboard-grid fade-in-up">
      {/* PLATFORM METRICS TRENDS */}
      <div className="analytics-card revenue-card">
        <div className="analytics-card-top">
          <div>
            <h3 className="analytics-card-title">Platform Total Revenue</h3>
            <p className="analytics-card-subtitle">Lifetime earnings & core platform metrics</p>
          </div>
          <div className="analytics-revenue-total">
            <div className="rev-amount">{revAmount}</div>
          </div>
        </div>
        <div className="analytics-chart-wrapper" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformMetrics} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <Tooltip
                cursor={{ fill: '#FAF2F5' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
              />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8A7781', fontSize: 12 }} dy={10} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={1500}>
                {platformMetrics.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#A91B60' : '#E6B8CB'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SERVICE CATEGORY */}
      <div className="analytics-card analytics-service-card">
        <h3 className="analytics-card-title">Service Category</h3>
        <div className="pie-chart-wrapper" style={{ height: 200, position: 'relative', marginTop: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={serviceData}
                innerRadius={70}
                outerRadius={90}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
                animationDuration={1500}
              >
                {serviceData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-chart-center-text">
            <div className="pie-center-val">
              {salons.reduce((acc, salon) => acc + (salon._count?.services || 0), 0)}
            </div>
            <div className="pie-center-label">TOTAL</div>
          </div>
        </div>
        <div className="service-legend">
          {serviceData.map((item: any, i: number) => (
            <div className="legend-item" key={i}>
              <div className="legend-left">
                <span className="legend-dot" style={{ backgroundColor: item.color }}></span>
                <span className="legend-name">{item.name}</span>
              </div>
              <div className="legend-val">{item.value}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* NEW REGISTRATIONS */}
      <div className="analytics-card registrations-card">
        <div className="registrations-header">
          <h3 className="analytics-card-title" style={{ maxWidth: '120px' }}>User Base</h3>
          <div className="registrations-legend">
            <span className="reg-legend-item"><span className="dot clients-dot"></span> Clients</span>
            <span className="reg-legend-item"><span className="dot owners-dot"></span> Owners</span>
          </div>
        </div>
        <div className="registrations-bars">
          {registrationsData.map((row, i) => {
            const clientPct = row.total ? (row.clients / row.total) * 100 : 0;
            const ownerPct = row.total ? (row.owners / row.total) * 100 : 0;
            return (
              <div className="reg-week-row" key={i}>
                <div className="reg-week-top">
                  <span className="reg-week-label">{row.label}</span>
                  <span className="reg-week-val">{row.total} Users</span>
                </div>
                <div className="stacked-bar-track">
                  <div className="stacked-bar-fill clients-fill" style={{ width: `${clientPct}%` }}></div>
                  <div className="stacked-bar-fill owners-fill" style={{ width: `${ownerPct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MINIMALIST SYSTEM ACTIVITY */}
      <div className="analytics-card platform-activity-card">
        <div className="analytics-card-top" style={{ marginBottom: '16px' }}>
          <div>
            <h3 className="analytics-card-title">System Activity</h3>
            <p className="analytics-card-subtitle">Real-time platform stats</p>
          </div>
          <span className="health-badge-online">Live Sync</span>
        </div>

        <div className="minimal-health-list">
          <div className="minimal-health-item">
            <span className="minimal-item-label">Pending Approvals</span>
            <span className={`minimal-item-val ${stats?.salons?.pending > 0 ? 'pink' : ''}`}>
              {stats?.salons?.pending || 0} Salons
            </span>
          </div>
          <div className="minimal-health-item">
            <span className="minimal-item-label">Total Appointments</span>
            <span className="minimal-item-val green">
              {stats?.appointments?.total || 0} Bookings
            </span>
          </div>
          <div className="minimal-health-item">
            <span className="minimal-item-label">Active Salons</span>
            <span className="minimal-item-val">
              {stats?.salons?.approved || 0} Approved
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
