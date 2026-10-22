import React from 'react';
import { DotsVertical } from '@untitledui/icons';
import { Button } from '../buttons/button';
import { Dropdown } from './dropdown';

export function DropdownIconSimple({
  items = [
    { label: 'Inspect EPD Details', action: 'inspect' },
    { label: 'Download PDF Declaration', action: 'download' },
    { label: 'Verify Cryptographic Lineage', action: 'verify' },
  ],
  onSelect,
}) {
  return (
    <Dropdown.Root>
      <Button size="sm" color="tertiary" iconLeading={DotsVertical} aria-label="More actions" title="More actions" />
      <Dropdown.Popover>
        <Dropdown.Menu onAction={(key) => onSelect?.(items.find((item) => String(item.action || item.label) === String(key)))}>
          <Dropdown.Section>
            {items.map((item) => (
              <Dropdown.Item key={item.action || item.label} id={item.action || item.label}>
                {item.label}
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}

export default DropdownIconSimple;
