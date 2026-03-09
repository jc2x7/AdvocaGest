// Consulta de CEP usando a API ViaCEP (viacep.com.br)

export interface ViaCepAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  ddd: string;
}

interface ViaCepErrorResponse {
  erro: true;
}

type ViaCepResponse = ViaCepAddress | ViaCepErrorResponse;

function isErrorResponse(data: ViaCepResponse): data is ViaCepErrorResponse {
  return 'erro' in data && data.erro === true;
}

export async function fetchAddressByCep(cep: string): Promise<ViaCepAddress | null> {
  const cleanCep = cep.replace(/\D/g, '');

  if (cleanCep.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data: ViaCepResponse = await response.json();

    if (isErrorResponse(data)) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function formatAddress(address: ViaCepAddress): string {
  const parts: string[] = [];

  if (address.logradouro) {
    parts.push(address.logradouro);
  }

  if (address.bairro) {
    parts.push(address.bairro);
  }

  if (address.localidade && address.uf) {
    parts.push(`${address.localidade}/${address.uf}`);
  }

  if (address.cep) {
    parts.push(`CEP: ${address.cep}`);
  }

  return parts.join(', ');
}

export function formatCityState(address: ViaCepAddress): string {
  if (address.localidade && address.uf) {
    return `${address.localidade}/${address.uf}`;
  }
  return '';
}
