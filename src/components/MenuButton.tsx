type MenuButtonProps = {
  label: string
  onClick: () => void
  isSelected: boolean
}

function MenuButton({ label, onClick, isSelected }: MenuButtonProps) {
  return (
    <button
      className={`menu-button${isSelected ? ' menu-button--selected' : ''}`}
      onClick={onClick}
    >
      <span className="menu-button__cursor">{isSelected ? '▶' : ' '}</span>
      {label}
    </button>
  )
}

export default MenuButton
