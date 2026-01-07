import { Link } from 'react-router-dom';
import { useConnectionQuery, useGetServicesQuery } from '../shared/src/web';

type ActionOrReaction = { name: string; description: string };
type Service = {
  name: string;
  actions: ActionOrReaction[];
  reactions: ActionOrReaction[];
};

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function ServiceItem({ name }: { name: string }) {
  const connection = useConnectionQuery({ provider: name });

  return (
    <li>
      {connection.data?.connected ? (
        <Link to={`/${name}`}>{capitalize(name)}</Link>
      ) : (
        <span style={{ color: 'gray', cursor: 'not-allowed' }}>
          {capitalize(name)}
        </span>
      )}
      {connection.data?.connected && <span> Connecté</span>}
    </li>
  );
}

export function Services() {
  const { data: servicesData } = useGetServicesQuery();
  const services: Service[] = servicesData?.server?.services ?? [];

  if (services.length === 0) {
    return <p>Aucun service disponible pour le moment.</p>;
  }

  return (
    <div>
      <h1>Services</h1>
      <ul>
        {services.map((service) => (
          <ServiceItem key={service.name} name={service.name} />
        ))}
      </ul>
    </div>
  );
}
